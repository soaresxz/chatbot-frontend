from app.core.database import SessionLocal
from app.models.conversation_status import ConversationStatus
from app.models.tenant import Tenant
from datetime import datetime, timedelta

def simulate_attendant():
    db = SessionLocal()
    
    print("\n" + "="*70)
    print("🧪 SIMULADOR DE ATENDENTE - Ativar Modo Humano (Teste Twilio)")
    print("="*70)
    
    # Lista os tenants (clínicas)
    tenants = db.query(Tenant).all()
    if not tenants:
        print("❌ Nenhum tenant encontrado.")
        db.close()
        return
    
    print(f"\nTenants encontrados ({len(tenants)}):")
    for t in tenants:
        print(f"   📱 {t.whatsapp_number} | {t.name or 'Sem nome'}")

    # Pega o primeiro tenant (você tem só 1)
    tenant = tenants[0]
    print(f"\nUsando clínica: {tenant.name} ({tenant.whatsapp_number})")

    # Pede o número do paciente
    patient_phone = input("\nDigite o número do PACIENTE (ex: +5579981171862): ").strip()

    # Ativa modo humano para esse paciente
    status = db.query(ConversationStatus).filter(
        ConversationStatus.tenant_id == tenant.id,
        ConversationStatus.patient_phone == patient_phone
    ).first()

    if not status:
        status = ConversationStatus(
            tenant_id=tenant.id,
            patient_phone=patient_phone,
            human_mode_active=True,
            human_mode_until=datetime.utcnow() + timedelta(hours=24)
        )
        db.add(status)
    else:
        status.human_mode_active = True
        status.human_mode_until = datetime.utcnow() + timedelta(hours=24)

    db.commit()
    
    print(f"\n✅ MODO HUMANO ATIVADO COM SUCESSO!")
    print(f"   Paciente: {patient_phone}")
    print(f"   Até: {status.human_mode_until.strftime('%d/%m/%Y %H:%M')}")
    print(f"   O bot NÃO vai mais responder automaticamente para esse paciente.")

    db.close()

if __name__ == "__main__":
    simulate_attendant()