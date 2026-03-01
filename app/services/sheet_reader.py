import gspread
from google.oauth2.service_account import Credentials
from datetime import datetime, timedelta
import dateparser
from typing import List, Dict, Optional
import os

class GoogleSheetReader:
    def __init__(self):
        import json
        import base64
        import os
        from google.oauth2.service_account import Credentials

        creds_base64 = os.getenv("GOOGLE_CREDENTIALS_BASE64")
        if not creds_base64:
            raise ValueError("❌ GOOGLE_CREDENTIALS_BASE64 não configurada no Railway!")

        try:
            # Decodifica base64 de volta para o JSON original exato
            creds_json = base64.b64decode(creds_base64).decode("utf-8")
            creds_dict = json.loads(creds_json)
        except Exception as e:
            raise ValueError(f"❌ Erro ao decodificar base64: {e}")

        scopes = ["https://www.googleapis.com/auth/spreadsheets"]
        
        creds = Credentials.from_service_account_info(creds_dict, scopes=scopes)
        
        self.client = gspread.authorize(creds)
        self.spreadsheet = self.client.open_by_key("185tXR5NF23pzRxhXOuwUz10Mwh96Hp0MRA1JximaixA")
        self.worksheet = self.spreadsheet.worksheet("AGENDA")   # nome da aba

    def get_available_slots(self, date_str: str, dentist: str = None) -> List[Dict]:
        """Retorna todos os horários livres em uma data específica"""
        try:
            target_date = dateparser.parse(date_str, languages=['pt']).date()
        except:
            target_date = datetime.now().date()

        # Pega todas as linhas da planilha
        data = self.worksheet.get_all_values()
        headers = data[0] if data else []
        rows = data[1:]  # ignora cabeçalho

        available = []
        for row in rows:
            if len(row) < 7:
                continue
                
            row_date_str = row[0].strip()  # Coluna A: Data de conclusão
            horario = row[1].strip()       # Coluna B: Horário
            nome_paciente = row[3].strip() # Coluna D: Nome do paciente
            nome_dentista = row[4].strip() # Coluna E: Nome do dentista
            status = row[6].strip() if len(row) > 6 else ""  # Coluna G: Status

            try:
                row_date = dateparser.parse(row_date_str, languages=['pt']).date()
            except:
                continue

            if row_date == target_date:
                # Horário está livre se nome do paciente estiver vazio OU status = "Não iniciada"
                if (not nome_paciente or nome_paciente == "" or status.lower() in ["Não iniciada", "Livre", "disponível"]):
                    if dentist is None or dentist.lower() in nome_dentista.lower():
                        available.append({
                            "date": row_date_str,
                            "time": horario,
                            "dentist": nome_dentista or "Qualquer dentista",
                            "row_index": len(available) + 2  # índice real na planilha (começa em 2)
                        })

        return available

    def book_slot(self, date_str: str, time: str, patient_name: str, patient_phone: str, dentist: str = None) -> bool:
        """Agenda um horário atualizando a planilha"""
        data = self.worksheet.get_all_values()
        
        for i, row in enumerate(data):
            if len(row) < 2:
                continue
                
            row_date = row[0].strip()
            row_time = row[1].strip()
            
            if row_date == date_str and row_time == time:
                # Atualiza Nome do paciente (coluna D = índice 3)
                # Nome do dentista (coluna E = índice 4) se não tiver
                # Status (coluna G = índice 6)
                cell_patient = f"D{i+1}"
                cell_dentist = f"E{i+1}"
                cell_status = f"G{i+1}"
                
                self.worksheet.update(cell_patient, patient_name)
                if dentist:
                    self.worksheet.update(cell_dentist, dentist)
                self.worksheet.update(cell_status, "Agendado")
                
                print(f"✅ Agendado com sucesso: {date_str} às {time} - {patient_name}")
                return True
                
        print(f"❌ Horário não encontrado: {date_str} {time}")
        return False

# Instância global
sheet_reader = GoogleSheetReader()