const fs = require('fs');

// Ler o arquivo de questões
const data = JSON.parse(fs.readFileSync('questions/Padrão.txt', 'utf-8'));

// Extrair matérias e dificuldades únicas
const materiasSet = new Set();
const dificuldadesSet = new Set();
const materiaCount = {};
const dificuldadeCount = {};

data.forEach(q => {
    const mat = q.materia || '';
    const dif = q.dificuldade || '';

    materiasSet.add(mat);
    dificuldadesSet.add(dif);

    materiaCount[mat] = (materiaCount[mat] || 0) + 1;
    dificuldadeCount[dif] = (dificuldadeCount[dif] || 0) + 1;
});

// Converter para arrays e ordenar
const materias = Array.from(materiasSet).sort();
const dificuldades = Array.from(dificuldadesSet).sort();

// Exibir resultados
console.log('='.repeat(60));
console.log('ANÁLISE DE MATÉRIAS');
console.log('='.repeat(60));
console.log(`\nTotal de questões: ${data.length}\n`);

console.log('MATÉRIAS ÚNICAS (ordenadas alfabeticamente):');
console.log('-'.repeat(60));
materias.forEach((m, i) => {
    console.log(`${(i + 1).toString().padStart(2)}. '${m}' → ${materiaCount[m]} questões`);
});
console.log(`\nTotal de matérias diferentes: ${materias.length}`);

console.log('\n' + '='.repeat(60));
console.log('ANÁLISE DE DIFICULDADES');
console.log('='.repeat(60));
console.log('\nDIFICULDADES ÚNICAS:');
console.log('-'.repeat(60));
dificuldades.forEach((d, i) => {
    console.log(`${i + 1}. '${d}' → ${dificuldadeCount[d]} questões`);
});
console.log(`\nTotal de níveis diferentes: ${dificuldades.length}`);

// Verificar inconsistências específicas
console.log('\n' + '='.repeat(60));
console.log('VERIFICAÇÃO DE INCONSISTÊNCIAS');
console.log('='.repeat(60));

// Verificar "Média" vs "Médio"
const hasMedia = dificuldadeCount['Média'] > 0;
const hasMedio = dificuldadeCount['Médio'] > 0;

if (hasMedia && hasMedio) {
    console.log(`\n⚠️ ENCONTRADO: Mistura de 'Média' (${dificuldadeCount['Média']}) e 'Médio' (${dificuldadeCount['Médio']})`);
} else if (hasMedia) {
    console.log(`\n✅ Todas usam 'Média' (${dificuldadeCount['Média']} questões)`);
} else if (hasMedio) {
    console.log(`\n✅ Todas usam 'Médio' (${dificuldadeCount['Médio']} questões)`);
}

// Verificar matérias compostas (com "/")
const materiasCompostas = materias.filter(m => m.includes('/'));
if (materiasCompostas.length > 0) {
    console.log(`\n⚠️ MATÉRIAS COMPOSTAS ENCONTRADAS (${materiasCompostas.length}):`);
    materiasCompostas.forEach(mat => {
        console.log(`   - '${mat}' → ${materiaCount[mat]} questões`);
    });
}

console.log('\n' + '='.repeat(60));
