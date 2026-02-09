import json
from collections import Counter

# Ler o arquivo de questões
with open('questions/Padrão.txt', 'r', encoding='utf-8') as f:
    questoes = json.load(f)

# Extrair matérias e dificuldades únicas
materias = [q.get('materia', '') for q in questoes]
dificuldades = [q.get('dificuldade', '') for q in questoes]

# Contar ocorrências
materias_counter = Counter(materias)
dificuldades_counter = Counter(dificuldades)

# Exibir resultados
print("=" * 60)
print("ANÁLISE DE MATÉRIAS")
print("=" * 60)
print(f"\nTotal de questões: {len(questoes)}\n")

print("MATÉRIAS ÚNICAS (ordenadas alfabeticamente):")
print("-" * 60)
for i, materia in enumerate(sorted(materias_counter.keys()), 1):
    count = materias_counter[materia]
    print(f"{i:2d}. '{materia}' → {count} questões")

print(f"\nTotal de matérias diferentes: {len(materias_counter)}")

print("\n" + "=" * 60)
print("ANÁLISE DE DIFICULDADES")
print("=" * 60)
print("\nDIFICULDADES ÚNICAS:")
print("-" * 60)
for i, dificuldade in enumerate(sorted(dificuldades_counter.keys()), 1):
    count = dificuldades_counter[dificuldade]
    print(f"{i}. '{dificuldade}' → {count} questões")

print(f"\nTotal de níveis diferentes: {len(dificuldades_counter)}")

# Verificar inconsistências específicas
print("\n" + "=" * 60)
print("VERIFICAÇÃO DE INCONSISTÊNCIAS")
print("=" * 60)

# Verificar "Média" vs "Médio"
if 'Média' in dificuldades_counter and 'Médio' in dificuldades_counter:
    print(f"\n⚠️ ENCONTRADO: Mistura de 'Média' ({dificuldades_counter['Média']}) e 'Médio' ({dificuldades_counter['Médio']})")
elif 'Média' in dificuldades_counter:
    print(f"\n✅ Todas usam 'Média' ({dificuldades_counter['Média']} questões)")
elif 'Médio' in dificuldades_counter:
    print(f"\n✅ Todas usam 'Médio' ({dificuldades_counter['Médio']} questões)")

# Verificar matérias compostas (com "/")
materias_compostas = [m for m in materias_counter.keys() if '/' in m]
if materias_compostas:
    print(f"\n⚠️ MATÉRIAS COMPOSTAS ENCONTRADAS ({len(materias_compostas)}):")
    for mat in sorted(materias_compostas):
        print(f"   - '{mat}' → {materias_counter[mat]} questões")

print("\n" + "=" * 60)
