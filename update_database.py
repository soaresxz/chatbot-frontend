from app.core.database import engine
import sqlalchemy as sa

print("🔄 Atualizando tabela tenants...")

with engine.connect() as conn:
    inspector = sa.inspect(engine)
    columns = [col['name'] for col in inspector.get_columns('tenants')]

    if 'attendant_phone' not in columns:
        print("➕ Adicionando coluna 'attendant_phone'...")
        conn.execute(sa.text("ALTER TABLE tenants ADD COLUMN attendant_phone VARCHAR"))
        print("✅ Coluna adicionada com sucesso!")
    else:
        print("✅ Coluna attendant_phone já existe.")

print("\n🎉 Banco atualizado! Agora pode rodar o servidor.")