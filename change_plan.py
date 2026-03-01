from app.core.database import SessionLocal
from app.models.tenant import Tenant

def change_plan():
    db = SessionLocal()
    
    while True:
        print("\n" + "="*70)
        print("🔄 GERENCIADOR DE PLANOS - OdontoIA")
        print("="*70)
        
        tenants = db.query(Tenant).all()
        
        if not tenants:
            print("❌ Nenhum tenant encontrado.")
            break
            
        print(f"\n📋 {len(tenants)} tenant(s) encontrado(s):\n")
        for i, t in enumerate(tenants, 1):
            human = "🟢 ATIVO" if t.human_mode_active else "⚪ Inativo"
            print(f"{i}. 📱 {t.whatsapp_number} | {t.name or 'Sem nome'} | Plano: **{t.plan or 'None'}** | Humano: {human}")
        
        print("\n" + "-"*70)
        print("O que deseja fazer?")
        print("1 → Mudar para BASIC")
        print("2 → Mudar para PREMIUM")
        print("3 → Ativar/Desativar Modo Humano")
        print("4 → Sair")
        
        escolha = input("\nDigite o número da opção (1-4): ").strip()
        
        if escolha == "4":
            print("👋 Saindo...")
            break
            
        if escolha not in ["1", "2", "3"]:
            print("❌ Opção inválida!")
            continue
        
        # Escolhe qual tenant
        try:
            idx = int(input("\nDigite o número do tenant (ex: 1): ")) - 1
            tenant = tenants[idx]
        except:
            print("❌ Número inválido!")
            continue
        
        if escolha == "1":
            tenant.plan = "basic"
            print(f"✅ {tenant.whatsapp_number} → BASIC")
            
        elif escolha == "2":
            tenant.plan = "premium"
            print(f"✅ {tenant.whatsapp_number} → PREMIUM")
            
        elif escolha == "3":
            tenant.human_mode_active = not tenant.human_mode_active
            status = "ATIVADO" if tenant.human_mode_active else "DESATIVADO"
            print(f"✅ Modo Humano {status} para {tenant.whatsapp_number}")
        
        db.commit()
        print("💾 Alteração salva no banco!\n")

    db.close()

if __name__ == "__main__":
    change_plan()