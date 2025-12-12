

export const SUBJECTS = [
  { name: "Português", progress: 75, color: "bg-slate-600", icon: "📚", studiedHours: 45, totalHours: 60 },
  { name: "Matemática", progress: 60, color: "bg-slate-800", icon: "📐", studiedHours: 36, totalHours: 60 },
  { name: "Ciências Naturais", progress: 45, color: "bg-slate-400", icon: "🧬", studiedHours: 27, totalHours: 60 },
  { name: "Ciências Humanas", progress: 80, color: "bg-slate-500", icon: "🌍", studiedHours: 48, totalHours: 60 },
];

export const TASKS = [
  { id: 1, title: "Revisar Equações de 2º Grau", subject: "Matemática", done: false },
  { id: 2, title: "Ler 'O Cortiço' - Cap 3", subject: "Literatura", done: true },
  { id: 3, title: "Simulado Rápido: Física", subject: "Ciências", done: false },
];

export const UPCOMING_EVENTS = [
  { date: "15 Out", title: "Inscrição ETEC", type: "deadline" },
  { date: "20 Out", title: "Simulado Geral", type: "exam" },
  { date: "15 Dez", title: "Prova Oficial", type: "exam" },
];

export interface Question {
  id: number;
  subject: string;
  source: string; // Ex: "1º SEM/2024"
  contextText?: string; // OBRIGATÓRIO PARA ETEC: Texto base, trecho de notícia, poema, etc.
  competency?: string; // Ex: "C5 - Interpretar dados"
  text: string; // A pergunta em si (Comando)
  imagePrompt?: string; // Prompt para gerar a imagem da questão
  alternatives: string[]; // A, B, C, D, E
  correctIndex: number; // 0-4
}

export const MOCK_EXAM_QUESTIONS: Question[] = [
  {
    id: 1,
    subject: "Biologia/Genética",
    source: "1º SEM/2024",
    contextText: "O albinismo é uma condição causada pela deficiência na produção de melanina. Pessoas com essa condição apresentam pele muito clara e sensibilidade ao sol, o que exige cuidados constantes, como o uso de protetor solar.",
    competency: "Identificar padrões em fenômenos biológicos",
    text: "Considerando a genética clássica e o texto acima, o albinismo é uma característica recessiva que pode acontecer quando:",
    // Sem imagem - questão teórica textual
    alternatives: [
      "Apenas um dos pais adquire problemas infeciosos na pele durante a infância.",
      "Apenas um dos pais é albino, e o outro é não albino e homozigoto.",
      "Nenhum dos pais é albino, mas ambos são heterozigotos (portadores do gene).",
      "Nenhum dos pais é albino, mas ambos são homozigotos dominantes.",
      "Ambos os pais têm histórico de subnutrição infantil."
    ],
    correctIndex: 2 // Gabarito Oficial: C
  },
  {
    id: 2,
    subject: "Física",
    source: "1º SEM/2019",
    contextText: "A ficção científica muitas vezes desafia as leis da física. Na saga Star Wars, a 'velocidade da luz' é frequentemente citada como um limite para viagens interestelares.",
    competency: "Relacionar grandezas físicas em contextos reais ou fictícios",
    text: "A Estrela da Morte precisa se posicionar para um ataque. Inicialmente no ponto A, ela vai para o ponto B percorrendo uma distância de 13,5 × 10^5 km na velocidade da luz (3,0 × 10^5 km/s). Quanto tempo demoraria esse deslocamento?",
    imagePrompt: "Simple schematic diagram in physics style, black lines on white background. Point A and Point B separated by a straight line. The line is labeled 'd = 13.5 x 10^5 km'. An arrow indicates movement from A to B with label 'v = c'. No complex background.",
    alternatives: [
      "4,5 segundos",
      "15,0 segundos",
      "45,0 segundos",
      "353 segundos",
      "3530 segundos"
    ],
    correctIndex: 0 // Gabarito Oficial Adaptado
  },
  {
    id: 3,
    subject: "Matemática/Saneamento",
    source: "2º SEM/2023",
    contextText: "O tratamento de água é essencial para a saúde pública. Grandes volumes de água precisam ser processados em estações de tratamento (ETAs) para abastecer as cidades.",
    competency: "Resolver situações-problema envolvendo grandezas e medidas",
    text: "A vazão (z) é a rapidez com que o volume (v) de um fluido escoa ao longo do tempo (t). Se a vazão de água da Sabesp é de 1,2 × 10^5 L/s, qual o volume tratado em 1 minuto (60 segundos)?",
    // Sem imagem - cálculo matemático direto
    alternatives: [
      "1,2 × 10^6 L",
      "7,2 × 10^5 L",
      "7,2 × 10^6 L",
      "1,2 × 10^7 L",
      "7,2 × 10^7 L"
    ],
    correctIndex: 2 // Gabarito Oficial: C
  },
  {
    id: 4,
    subject: "Química",
    source: "1º SEM/2019",
    competency: "Classificar elementos químicos e reconhecer suas propriedades",
    text: "Dmitry Mendeleev organizou os elementos químicos baseando-se em suas propriedades. Atualmente, a Tabela Periódica moderna é organizada rigorosamente em ordem crescente de:",
    imagePrompt: "A clean, educational illustration of a segment of the Periodic Table of Elements. Focus on Hydrogen (1), Helium (2), Lithium (3), Beryllium (4) showing the numbers increasing clearly. Scientific textbook style.",
    alternatives: [
      "Massa atômica",
      "Número de nêutrons",
      "Número atômico (Z)",
      "Raio atômico",
      "Eletronegatividade"
    ],
    correctIndex: 2 // Gabarito Oficial: C
  },
  {
    id: 5,
    subject: "História/Geografia",
    source: "2º SEM/2023",
    contextText: "Durante os séculos XVII e XVIII, a expansão territorial do Brasil para além do Tratado de Tordesilhas foi impulsionada por expedições que buscavam riquezas no interior.",
    competency: "Analisar processos históricos e geográficos de ocupação do território",
    text: "O mapa das 'Drogas do Sertão' mostra a ocupação da Amazônia. As expedições particulares que partiram de São Paulo para capturar indígenas e buscar metais preciosos eram chamadas de:",
    imagePrompt: "Historical map of Brazil from 17th century style, sepia tone. Arrows originating from the region of São Paulo pointing towards the interior (Minas Gerais, Mato Grosso, Goiás). Legend text is blurry/unreadable to not give away answer.",
    alternatives: [
      "Entradas",
      "Bandeiras",
      "Missões Jesuíticas",
      "Feitorias",
      "Capitanias Hereditárias"
    ],
    correctIndex: 1 // Gabarito Oficial: B
  },
  {
    id: 6,
    subject: "Interdisciplinar",
    source: "1º SEM/2018",
    contextText: "A língua é viva e muda de acordo com o falante e a situação. Observe a frase: 'Meu amigo Hélio diz sonoramente trêss e déss'.",
    competency: "Reconhecer variedades linguísticas e normas gramaticais",
    text: "O autor discute variações linguísticas. Se Hélio corrige 'duzentas gramas' para 'duzentos gramas', ele está apontando um erro de:",
    // Sem imagem - questão puramente gramatical/linguística
    alternatives: [
      "Concordância nominal",
      "Concordância verbal",
      "Regência nominal",
      "Regência verbal",
      "Colocação pronominal"
    ],
    correctIndex: 0 // Gabarito Oficial: A
  }
];