import { SupportedLanguage, RecordingResult, Participant, MeetingRoom, ScheduledMeeting } from '../types';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { name: 'English', code: 'en', flag: '🇬🇧', nativeName: 'English' },
  { name: 'Welsh', code: 'cy', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', nativeName: 'Cymraeg' },
  { name: 'French', code: 'fr', flag: '🇫🇷', nativeName: 'Français' },
  { name: 'Spanish', code: 'es', flag: '🇪🇸', nativeName: 'Español' },
  { name: 'German', code: 'de', flag: '🇩🇪', nativeName: 'Deutsch' },
  { name: 'Hindi', code: 'hi', flag: '🇮🇳', nativeName: 'हिन्दी' },
];

export const DEFAULT_PARTICIPANTS: Participant[] = [
  {
    id: 'part-0',
    email: 'nishabhatt.bhatt@gmail.com',
    firstName: 'Nisha',
    lastName: 'Bhatt',
    fullName: 'Nisha Bhatt',
    isAdmin: true,
    department: 'Executive Leadership',
    jobTitle: 'Meeting Host & Lead Strategist',
    isM365User: true,
  },
  {
    id: 'part-1',
    email: 'carys.evans@gov.wales',
    firstName: 'Carys',
    lastName: 'Evans',
    fullName: 'Carys Evans',
    isAdmin: true,
    department: 'Policy & Standards',
    jobTitle: 'Senior Welsh Language Commissioner',
    isM365User: true,
  },
  {
    id: 'part-2',
    email: 'gareth.thomas@council.gov.uk',
    firstName: 'Gareth',
    lastName: 'Thomas',
    fullName: 'Gareth Thomas',
    isAdmin: true,
    department: 'Digital Services',
    jobTitle: 'Head of Civic Technology',
    isM365User: true,
  },
  {
    id: 'part-3',
    email: 'elin.roberts@health.cymru',
    firstName: 'Elin',
    lastName: 'Roberts',
    fullName: 'Elin Roberts',
    isAdmin: false,
    department: 'Public Health NHS',
    jobTitle: 'Director of Multilingual Communications',
    isM365User: true,
  },
  {
    id: 'part-4',
    email: 'dafydd.llywelyn@tech.cymru',
    firstName: 'Dafydd',
    lastName: 'Llywelyn',
    fullName: 'Dafydd Llywelyn',
    isAdmin: false,
    department: 'AI & Data Ethics',
    jobTitle: 'Lead Speech Architect',
    isM365User: true,
  },
  {
    id: 'part-5',
    email: 'sarah.jenkins@consulting.com',
    firstName: 'Sarah',
    lastName: 'Jenkins',
    fullName: 'Sarah Jenkins',
    isAdmin: false,
    department: 'Governance & Audit',
    jobTitle: 'External Evaluator',
    isM365User: false,
  },
];

export const DEFAULT_MEETING_ROOMS: MeetingRoom[] = [
  {
    id: 'room-1',
    name: 'Executive Boardroom (Ystafell Weithredol)',
    building: 'Civic Centre - Tower A',
    floor: 'Floor 4',
    capacity: 20,
    features: ['Teams Rooms Pro', 'Dual 4K Displays', 'Ceiling Mic Array', 'AI Auto-Framing'],
    isAvailable: true,
  },
  {
    id: 'room-2',
    name: 'Snowdonia Innovation Suite',
    building: 'Digital Innovation Hub',
    floor: 'Floor 2',
    capacity: 12,
    features: ['Microsoft Teams Certified', 'Touch Whiteboard', 'Poly Studio X50'],
    isAvailable: true,
  },
  {
    id: 'room-3',
    name: 'Cardiff Media Studio 1',
    building: 'Media & Communications Wing',
    floor: 'Ground Floor',
    capacity: 8,
    features: ['Acoustic Soundproofing', 'Studio Microphones', 'Live Captioning Monitors'],
    isAvailable: true,
  },
  {
    id: 'room-4',
    name: 'Caernarfon Collaborative Room',
    building: 'Civic Centre - Tower B',
    floor: 'Floor 1',
    capacity: 6,
    features: ['Teams Display', 'Conference Cam', 'Hybrid Table Mic'],
    isAvailable: true,
  },
  {
    id: 'room-5',
    name: 'Virtual Teams Room (Online Only)',
    building: 'Microsoft 365 Cloud Tenant',
    floor: 'Cloud',
    capacity: 250,
    features: ['Teams Live Event', 'AI Realtime Subtitles', 'Cloud Recording'],
    isAvailable: true,
  },
];

export const DEFAULT_SCHEDULED_MEETINGS: ScheduledMeeting[] = [
  {
    id: 'meet-101',
    title: 'Bilingual Strategy & Public Services Review',
    date: '2026-10-08',
    startTime: '10:00',
    endTime: '11:00',
    roomId: 'room-1',
    roomName: 'Executive Boardroom (Ystafell Weithredol)',
    speakers: [DEFAULT_PARTICIPANTS[0], DEFAULT_PARTICIPANTS[1]],
    inviteeEmails: [
      'nishabhatt.bhatt@gmail.com',
      'carys.evans@gov.wales',
      'gareth.thomas@council.gov.uk',
      'elin.roberts@health.cymru',
      'dafydd.llywelyn@tech.cymru',
    ],
    agenda: [
      {
        id: 'ag-1',
        title: 'Welcome & Welsh Language Standards Compliance',
        durationMinutes: 15,
        presenter: 'Carys Evans',
        notes: 'Review legal requirements for public bodies',
      },
      {
        id: 'ag-2',
        title: 'Real-time Multilingual Speech Architecture',
        durationMinutes: 25,
        presenter: 'Gareth Thomas',
        notes: 'Live demo with Welsh, English, French, Spanish, German, Hindi',
      },
      {
        id: 'ag-3',
        title: 'Action items, room allocations & next milestones',
        durationMinutes: 20,
        presenter: 'Carys Evans',
        notes: 'Agreement on deployment timeline',
      },
    ],
    objective: 'Finalise the bilingual transcription rollout across regional public portals.',
    targetLanguages: ['English', 'Welsh', 'French'],
    m365SyncEnabled: true,
    teamsMeetingLink: 'https://teams.microsoft.com/l/meetup-join/19%3ameeting_bilingual_strategy',
    invitesSent: true,
    invitesSentAt: '2026-10-07 09:15 AM',
    status: 'upcoming',
  },
  {
    id: 'meet-102',
    title: 'Digital Health Bilingual Consultation',
    date: '2026-10-09',
    startTime: '14:00',
    endTime: '15:30',
    roomId: 'room-2',
    roomName: 'Snowdonia Innovation Suite',
    speakers: [DEFAULT_PARTICIPANTS[2], DEFAULT_PARTICIPANTS[3]],
    inviteeEmails: ['nishabhatt.bhatt@gmail.com', 'elin.roberts@health.cymru', 'dafydd.llywelyn@tech.cymru'],
    agenda: [
      {
        id: 'ag-4',
        title: 'Patient Communication in Primary Care',
        durationMinutes: 30,
        presenter: 'Elin Roberts',
      },
      {
        id: 'ag-5',
        title: 'Terminology Validation in Speech AI',
        durationMinutes: 40,
        presenter: 'Dafydd Llywelyn',
      },
    ],
    objective: 'Ensure medical terms are properly translated across languages during triage.',
    targetLanguages: ['English', 'Welsh', 'Spanish', 'Hindi'],
    m365SyncEnabled: true,
    teamsMeetingLink: 'https://teams.microsoft.com/l/meetup-join/19%3ameeting_digital_health',
    invitesSent: false,
    status: 'upcoming',
  },
];

export function parseNameFromEmail(email: string): { firstName: string; lastName: string; fullName: string } {
  const localPart = (email.split('@')[0] || '').trim();
  // Strip numbers
  const cleaned = localPart.replace(/[0-9]/g, '');
  const parts = cleaned.split(/[._\-+]/).filter(Boolean);

  const capitalize = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

  if (parts.length >= 2) {
    const firstName = capitalize(parts[0]);
    const lastName = parts.slice(1).map(capitalize).join(' ');
    return { firstName, lastName, fullName: `${firstName} ${lastName}` };
  } else if (parts.length === 1 && parts[0].length > 0) {
    // Check camelCase (e.g. garethThomas)
    const camelMatch = parts[0].replace(/([a-z])([A-Z])/g, '$1 $2').split(' ');
    if (camelMatch.length >= 2) {
      const firstName = capitalize(camelMatch[0]);
      const lastName = camelMatch.slice(1).map(capitalize).join(' ');
      return { firstName, lastName, fullName: `${firstName} ${lastName}` };
    }
    const name = capitalize(parts[0]);
    return { firstName: name, lastName: '', fullName: name };
  }
  return { firstName: 'Participant', lastName: '', fullName: 'Participant' };
}

export const DEMO_SAMPLES: RecordingResult[] = [
  {
    id: 'sample-bilingual-sync',
    title: 'Bilingual Strategy & Public Services Review',
    createdAt: '10:30 AM',
    availableLanguages: ['English', 'Welsh', 'French', 'Spanish', 'German', 'Hindi'],
    activeTargetLanguage: 'Welsh',
    mediaType: 'video' as const,
    durationFormatted: '01:25',
    durationSeconds: 85,
    sourceLanguage: 'English',
    sourceLanguageCode: 'en',
    detectedTopic: 'Welsh Language Standards & Digital Services Rollout',
    overallSentiment: 'Positive' as const,
    videoPlaceholderType: 'presentation',
    fullTranscript: `Welcome everyone to our project review. Today we are focusing on our bilingual transcription engine and our commitment to the Welsh Language Standards. First, the new real-time speech recognition system accurately transcribes both English and Welsh speech with sub-second latency. Second, our team has integrated one-click exports into formatted PDF briefings and Word DOCX documents, ensuring both languages are presented side by side. Third, our target deployment across local authorities is next month. We need the testing group to complete validation of the Welsh terminology glossary by next Friday.`,
    segments: [
      {
        id: 'seg-1',
        speaker: 'Carys Evans',
        startTime: '00:00',
        endTime: '00:20',
        startSeconds: 0,
        endSeconds: 20,
        originalText: 'Welcome everyone to our project review. Today we are focusing on our bilingual transcription engine and our commitment to the Welsh Language Standards.',
        translations: {
          English: 'Welcome everyone to our project review. Today we are focusing on our bilingual transcription engine and our commitment to the Welsh Language Standards.',
          Welsh: 'Croeso i bawb i\'n hadolygiad prosiect. Heddiw rydym yn canolbwyntio ar ein peiriant trawsgrifio dwyieithog a\'n hymrwymiad i Safonau\'r Gymraeg.',
          French: 'Bienvenue à tous à notre revue de projet. Aujourd\'hui, nous nous concentrons sur notre moteur de transcription bilingue et notre engagement envers les normes de la langue galloise.',
          Spanish: 'Bienvenidos todos a nuestra revisión de proyecto. Hoy nos estamos enfocando en nuestro motor de transcripción bilingüe y nuestro compromiso con los Estándares de la Lengua Galesa.',
          German: 'Willkommen an alle zu unserer Projektüberprüfung. Heute konzentrieren wir uns auf unsere zweisprachige Transkriptions-Engine und unser Engagement für die walisischen Sprachstandards.',
          Hindi: 'हमारी परियोजना समीक्षा में आप सभी का स्वागत है। आज हम अपने द्विभाषी प्रतिलेखन इंजन और वेल्श भाषा मानकों के प्रति अपनी प्रतिबद्धता पर ध्यान केंद्रित कर रहे हैं।',
        },
      },
      {
        id: 'seg-2',
        speaker: 'Gareth Thomas',
        startTime: '00:21',
        endTime: '00:44',
        startSeconds: 21,
        endSeconds: 44,
        originalText: 'First, the new real-time speech recognition system accurately transcribes both English and Welsh speech with sub-second latency.',
        translations: {
          English: 'First, the new real-time speech recognition system accurately transcribes both English and Welsh speech with sub-second latency.',
          Welsh: 'Yn gyntaf, mae\'r system adnabod lleferydd amser real newydd yn trawsgrifio lleferydd Saesneg a Chymraeg yn gywir gydag oedi is-eiliad.',
          French: 'Premièrement, le nouveau système de reconnaissance vocale en temps réel transcrit fidèlement la parole en anglais et en gallois avec une latence inférieure à la seconde.',
          Spanish: 'Primero, el nuevo sistema de reconocimiento de voz en tiempo real transcribe con precisión tanto el habla en inglés como en galés con una latencia inferior a un segundo.',
          German: 'Erstens transkribiert das neue Echtzeit-Spracherkennungssystem sowohl englische als auch walisische Sprache präzise mit Latenzen unter einer Sekunde.',
          Hindi: 'सबसे पहले, नया रीयल-टाइम वाक् पहचान सिस्टम उप-सेकंड विलंबता के साथ अंग्रेजी और वेल्श दोनों भाषाओं का सटीक प्रतिलेखन करता है।',
        },
      },
      {
        id: 'seg-3',
        speaker: 'Carys Evans',
        startTime: '00:45',
        endTime: '01:05',
        startSeconds: 45,
        endSeconds: 65,
        originalText: 'Second, our team has integrated one-click exports into formatted PDF briefings and Word DOCX documents, ensuring both languages are presented side by side.',
        translations: {
          English: 'Second, our team has integrated one-click exports into formatted PDF briefings and Word DOCX documents, ensuring both languages are presented side by side.',
          Welsh: 'Yn ail, mae ein tîm wedi integreiddio allforion un clic i ffeiliau briffio PDF fformatiedig a dogfennau Word DOCX, gan sicrhau bod y ddwy iaith yn cael eu cyflwyno ochr yn ochr.',
          French: 'Deuxièmement, notre équipe a intégré des exportations en un clic vers des briefings PDF et des documents Word DOCX, garantissant que les deux langues sont présentées côte à côte.',
          Spanish: 'En segundo lugar, nuestro equipo ha integrado exportaciones con un solo clic a informes en PDF formateados y documentos Word DOCX, asegurando que ambos idiomas se presenten lado a lado.',
          German: 'Zweitens hat unser Team Ein-Klick-Exporte in formatierte PDF-Briefings und Word-DOCX-Dokumente integriert, sodass beide Sprachen nebeneinander dargestellt werden.',
          Hindi: 'दूसरा, हमारी टीम ने स्वरूपित पीडीएफ ब्रीफिंग और वर्ड डीओसीएक्स दस्तावेजों में एक-क्लिक निर्यात को एकीकृत किया है, जिससे दोनों भाषाएं साथ-साथ प्रस्तुत होती हैं।',
        },
      },
      {
        id: 'seg-4',
        speaker: 'Elin Roberts',
        startTime: '01:06',
        endTime: '01:25',
        startSeconds: 66,
        endSeconds: 85,
        originalText: 'Third, our target deployment across local authorities is next month. We need the testing group to complete validation of the Welsh terminology glossary by next Friday.',
        translations: {
          English: 'Third, our target deployment across local authorities is next month. We need the testing group to complete validation of the Welsh terminology glossary by next Friday.',
          Welsh: 'Yn drydydd, ein targed ar gyfer cyflwyno ar draws awdurdodau lleol yw mis nesaf. Mae angen i\'r grŵp profi gwblhau dilysiad o eirfa therminoleg Gymraeg erbyn dydd Gwener nesaf.',
          French: 'Troisièmement, notre déploiement cible auprès des autorités locales est prévu le mois prochain. Nous avons besoin que le groupe de test termine la validation d\'ici vendredi prochain.',
          Spanish: 'Tercero, nuestro despliegue objetivo en las autoridades locales es el próximo mes. Necesitamos que el grupo de pruebas complete la validación para el próximo viernes.',
          German: 'Drittens ist unser Rollout bei den lokalen Behörden für nächsten Monat geplant. Die Testgruppe muss die Validierung des Glossars bis nächsten Freitag abschließen.',
          Hindi: 'तीसरा, स्थानीय प्राधिकरणों में हमारा लक्षित परिनियोजन अगले महीने है। हमें परीक्षण समूह द्वारा अगले शुक्रवार तक शब्दावली सत्यापन पूरा करने की आवश्यकता है।',
        },
      },
    ],
    summary: {
      executive: 'The bilingual project team confirmed sub-second speech recognition and seamless multilingual translation. Key deliverables include automated one-click PDF and Word DOCX export capabilities ahead of next month\'s rollout across public authorities.',
      keyPoints: [
        'Real-time bilingual transcription operational between English, Welsh, French, Spanish, German, and Hindi.',
        'Automated one-click export generating parallel bilingual PDF and DOCX reports.',
        'Deployment timeline scheduled for next month across public sector partners.',
        'Terminology glossary validation deadline set for next Friday.',
      ],
      actionItems: [
        {
          task: 'Complete QA validation of the multilingual terminology glossary',
          owner: 'Elin Roberts',
          priority: 'High' as const,
        },
        {
          task: 'Distribute sample bilingual PDF & DOCX reports to stakeholders',
          owner: 'Carys Evans',
          priority: 'Medium' as const,
        },
      ],
      decisions: [
        'Approved multilingual transcription standards across all generated meeting records.',
        'Confirmed next month for regional local authority rollout.',
      ],
      translatedExecutive: {
        English: 'The bilingual project team confirmed sub-second speech recognition and seamless multilingual translation. Key deliverables include automated one-click PDF and Word DOCX export capabilities ahead of next month\'s rollout across public authorities.',
        Welsh: 'Cadarnhaodd y tîm prosiect dwyieithog adnabyddiaeth leferydd is-eiliad a chyfieithu amlieithog llyfn. Mae\'r prif ganlyniadau\'n cynnwys galluoedd allforio awtomataidd i fformat PDF a Word DOCX dwyieithog cyn y cyflwyniad mis nesaf ar draws awdurdodau cyhoeddus.',
        French: 'L\'équipe de projet a confirmé une reconnaissance vocale inférieure à la seconde et une traduction multilingue transparente. Les principaux livrables incluent l\'exportation automatisée en un clic.',
        Spanish: 'El equipo del proyecto confirmó el reconocimiento de voz en menos de un segundo y una traducción multilingüe fluida. Los entregables clave incluyen la exportación automatizada.',
        German: 'Das Projektteam bestätigte eine Spracherkennung unter einer Sekunde und eine nahtlose mehrsprachige Übersetzung mit automatisiertem PDF- und Word-Export.',
        Hindi: 'परियोजना टीम ने उप-सेकंड वाक् पहचान और निर्बाध बहुभाषी अनुवाद की पुष्टि की। मुख्य वितरणों में स्वचालित एक-क्लिक पीडीएफ और वर्ड निर्यात क्षमताएं शामिल हैं।',
      },
    },
  },
  {
    id: 'sample-welsh-announcement',
    title: 'Araith Gymraeg: Datblygiadau Digidol Cymru',
    createdAt: '02:15 PM',
    availableLanguages: ['English', 'Welsh', 'French', 'Spanish', 'German', 'Hindi'],
    activeTargetLanguage: 'English',
    mediaType: 'audio' as const,
    durationFormatted: '00:48',
    durationSeconds: 48,
    sourceLanguage: 'Welsh',
    sourceLanguageCode: 'cy',
    detectedTopic: 'Technoleg Ddigidol a\'r Iaith Gymraeg',
    overallSentiment: 'Positive' as const,
    videoPlaceholderType: 'conference',
    fullTranscript: `Bore da i bawb. Mae technoleg ddigidol a deallusrwydd artiffisial yn agor cyfleoedd gwych i\'r Gymraeg ffynnu yn y byd modern. Drwy ddarparu offer trawsgrifio a chyfieithu amser real, gallwn sicrhau bod pob cyfarfod a recordiad ar gael yn ddwyieithog ar unwaith. Mae hyn yn gwneud gwasanaethau cyhoeddus yn fwy hygyrch i bawb yng Nghymru.`,
    segments: [
      {
        id: 'seg-w1',
        speaker: 'Dafydd Llywelyn',
        startTime: '00:00',
        endTime: '00:24',
        startSeconds: 0,
        endSeconds: 24,
        originalText: 'Bore da i bawb. Mae technoleg ddigidol a deallusrwydd artiffisial yn agor cyfleoedd gwych i\'r Gymraeg ffynnu yn y byd modern. Drwy ddarparu offer trawsgrifio a chyfieithu amser real, gallwn sicrhau bod pob cyfarfod a recordiad ar gael yn ddwyieithog ar unwaith.',
        translations: {
          English: 'Good morning everyone. Digital technology and artificial intelligence are opening fantastic opportunities for the Welsh language to thrive in the modern world. By providing real-time transcription and translation tools, we can ensure that every meeting and recording is available bilingually right away.',
          Welsh: 'Bore da i bawb. Mae technoleg ddigidol a deallusrwydd artiffisial yn agor cyfleoedd gwych i\'r Gymraeg ffynnu yn y byd modern. Drwy ddarparu offer trawsgrifio a chyfieithu amser real, gallwn sicrhau bod pob cyfarfod a recordiad ar gael yn ddwyieithog ar unwaith.',
          French: 'Bonjour à tous. La technologie numérique et l\'intelligence artificielle ouvrent de fantastiques opportunités pour le développement de la langue galloise. En fournissant des outils de transcription et de traduction en temps réel, nous garantissons l\'accès bilingue immédiat.',
          Spanish: 'Buenos días a todos. La tecnología digital y la inteligencia artificial abren fantásticas oportunidades para la lengua galesa. Al proporcionar herramientas de transcripción y traducción en tiempo real, aseguramos la disponibilidad bilingüe inmediata.',
          German: 'Guten Morgen allerseits. Digitale Technologie und künstliche Intelligenz eröffnen fantastische Möglichkeiten für die walisische Sprache. Durch Echtzeit-Transkription stellen wir zweisprachige Verfügbarkeit sicher.',
          Hindi: 'सभी को सुप्रभात। डिजिटल तकनीक और कृत्रिम बुद्धिमत्ता आधुनिक दुनिया में वेल्श भाषा के फलने-फूलने के शानदार अवसर खोल रहे हैं। रीयल-टाइम प्रतिलेखन और अनुवाद उपकरण प्रदान करके, हम तुरंत द्विभाषी पहुंच सुनिश्चित कर सकते हैं।',
        },
      },
      {
        id: 'seg-w2',
        speaker: 'Dafydd Llywelyn',
        startTime: '00:25',
        endTime: '00:48',
        startSeconds: 25,
        endSeconds: 48,
        originalText: 'Mae hyn yn gwneud gwasanaethau cyhoeddus yn fwy hygyrch i bawb yng Nghymru.',
        translations: {
          English: 'This makes public services significantly more accessible for everyone across Wales.',
          Welsh: 'Mae hyn yn gwneud gwasanaethau cyhoeddus yn fwy hygyrch i bawb yng Nghymru.',
          French: 'Cela rend les services publics nettement plus accessibles à tous au Pays de Galles.',
          Spanish: 'Esto hace que los servicios públicos sean significativamente más accesibles para todos en Gales.',
          German: 'Dies macht öffentliche Dienstleistungen für alle in Wales deutlich zugänglicher.',
          Hindi: 'यह पूरे वेल्स में सभी के लिए सार्वजनिक सेवाओं को महत्वपूर्ण रूप से अधिक सुलभ बनाता है।',
        },
      },
    ],
    summary: {
      executive: 'Dafydd Llywelyn emphasized how AI-driven speech transcription and real-time translation empower bilingual communication across Wales, ensuring public records are instantly accessible in both Welsh and English.',
      keyPoints: [
        'Real-time Welsh-to-English speech translation enables immediate accessibility.',
        'Bilingual transcription standardizes accessibility across public sector services.',
      ],
      actionItems: [
        {
          task: 'Adopt live Welsh-English transcription for community hearings',
          owner: 'Dafydd Llywelyn',
          priority: 'Medium' as const,
        },
      ],
      decisions: [
        'Ensure all recordings provide instant Welsh-English transcription and summaries.',
      ],
      translatedExecutive: {
        English: 'Dafydd Llywelyn emphasized how AI-driven speech transcription and real-time translation empower bilingual communication across Wales, ensuring public records are instantly accessible in both Welsh and English.',
        Welsh: 'Pwysleisiodd Dafydd Llywelyn sut mae trawsgrifio lleferydd a chyfieithu amser real drwy ddeallusrwydd artiffisial yn grymuso cyfathrebu dwyieithog ledled Cymru, gan sicrhau bod cofnodion cyhoeddus ar gael ar unwaith yn y Gymraeg a\'r Saesneg.',
        French: 'Dafydd Llywelyn a souligné comment la transcription vocale par IA permet une communication bilingue fluide.',
        Spanish: 'Dafydd Llywelyn enfatizó cómo la transcripción de voz impulsada por IA potencia la comunicación bilingüe.',
        German: 'Dafydd Llywelyn betonte, wie KI-gestützte Sprachtranskription die zweisprachige Kommunikation in ganz Wales stärkt.',
        Hindi: 'डैफिड ललीवेलिन ने जोर दिया कि एआई-संचालित वाक् प्रतिलेखन पूरे वेल्स में द्विभाषी संचार को सशक्त बनाता है।',
      },
    },
  },
];
