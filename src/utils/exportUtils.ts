import jsPDF from 'jspdf';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
} from 'docx';
import { RecordingResult, ScheduledMeeting, TranscriptSegment } from '../types';

function sanitizeFilename(title: string): string {
  return title.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
}

/**
 * Convert a ScheduledMeeting into a rich RecordingResult for export & preview
 */
export function convertMeetingToRecording(
  meeting: ScheduledMeeting,
  targetLang: string = 'Welsh'
): RecordingResult {
  const speakerNames = meeting.speakers?.map((s) => s.fullName) || ['Nisha Bhatt', 'Carys Evans'];
  const primarySpeaker = speakerNames[0] || 'Meeting Host';
  const durationTotalMins = meeting.agenda?.reduce((acc, a) => acc + (a.durationMinutes || 15), 0) || 60;
  const durationFormatted = `${durationTotalMins}:00`;

  // Build segments from agenda items
  const segments: TranscriptSegment[] = (meeting.agenda && meeting.agenda.length > 0)
    ? meeting.agenda.map((ag, idx) => {
        const startMin = meeting.agenda.slice(0, idx).reduce((acc, a) => acc + (a.durationMinutes || 15), 0);
        const endMin = startMin + (ag.durationMinutes || 15);
        const startStr = `${startMin.toString().padStart(2, '0')}:00`;
        const endStr = `${endMin.toString().padStart(2, '0')}:00`;
        const presenter = ag.presenter || speakerNames[idx % speakerNames.length] || primarySpeaker;
        const orig = `Agenda Item ${idx + 1}: ${ag.title}. ${ag.notes ? `Key Focus: ${ag.notes}` : `Objective: ${meeting.objective || 'Align on bilingual delivery'}`}`;

        return {
          id: `ag-seg-${ag.id || idx}`,
          speaker: presenter,
          startTime: startStr,
          endTime: endStr,
          startSeconds: startMin * 60,
          endSeconds: endMin * 60,
          originalText: orig,
          translations: {
            Welsh: `Eitem Agenda ${idx + 1}: ${ag.title}. ${ag.notes ? `Prif Ffocws: ${ag.notes}` : `Amcan: ${meeting.objective || 'Alinio ar ddarpariaeth ddwyieithog'}`}`,
            English: orig,
            Spanish: `Punto ${idx + 1} de la agenda: ${ag.title}.`,
            French: `Point ${idx + 1} de l'ordre du jour: ${ag.title}.`,
            German: `Tagesordnungspunkt ${idx + 1}: ${ag.title}.`,
            Hindi: `कार्यसूची मद ${idx + 1}: ${ag.title}.`,
          },
        };
      })
    : [
        {
          id: 'seg-init',
          speaker: primarySpeaker,
          startTime: '00:00',
          endTime: durationFormatted,
          startSeconds: 0,
          endSeconds: durationTotalMins * 60,
          originalText: `Meeting session for ${meeting.title}. Objective: ${meeting.objective || 'Bilingual consultation & strategy alignment'}.`,
          translations: {
            Welsh: `Sesiwn cyfarfod ar gyfer ${meeting.title}. Amcan: ${meeting.objective || 'Ymgynghoriad dwyieithog ac aliniad strategaeth'}.`,
            English: `Meeting session for ${meeting.title}. Objective: ${meeting.objective || 'Bilingual consultation & strategy alignment'}.`,
            Spanish: `Sesión de reunión para ${meeting.title}.`,
            French: `Séance de réunion pour ${meeting.title}.`,
            German: `Meetingsitzung für ${meeting.title}.`,
            Hindi: `${meeting.title} के लिए बैठक सत्र।`,
          },
        },
      ];

  const execBrief = `Executive meeting brief for "${meeting.title}" scheduled on ${meeting.date} (${meeting.startTime} - ${meeting.endTime}) in ${meeting.roomName || 'Microsoft Teams'}. Objective: ${meeting.objective || 'Advance bilingual operational standards and Teams collaboration'}. Key attendees: ${speakerNames.join(', ')}.`;

  return {
    id: `meet-rec-${meeting.id}`,
    title: meeting.title,
    date: meeting.date,
    createdAt: `${meeting.date} • ${meeting.startTime} - ${meeting.endTime}`,
    meetingId: meeting.id,
    roomName: meeting.roomName,
    speakersList: speakerNames,
    agenda: meeting.agenda,
    objective: meeting.objective,
    durationSeconds: durationTotalMins * 60,
    durationFormatted,
    mediaType: 'audio',
    sourceLanguage: 'English',
    sourceLanguageCode: 'en',
    detectedTopic: meeting.objective || meeting.title,
    overallSentiment: 'Positive',
    fullTranscript: segments.map((s) => `[${s.startTime}] ${s.speaker}: ${s.originalText}`).join('\n'),
    segments,
    summary: {
      executive: execBrief,
      keyPoints: meeting.agenda?.map((a) => `${a.title} (${a.durationMinutes} mins) - Presenter: ${a.presenter || primarySpeaker}`) || [
        `Meeting objective: ${meeting.objective || 'Bilingual project delivery'}`,
        `Location & Facility: ${meeting.roomName || 'Executive Boardroom'}`,
        `Invited Participants: ${speakerNames.join(', ')}`,
      ],
      actionItems: meeting.agenda?.map((a, i) => ({
        task: `Review deliverables for ${a.title}`,
        owner: a.presenter || speakerNames[i % speakerNames.length] || primarySpeaker,
        priority: 'High' as const,
      })) || [
        {
          task: `Finalize bilingual notes for ${meeting.title}`,
          owner: primarySpeaker,
          priority: 'High' as const,
        },
      ],
      decisions: [
        `Confirmed meeting schedule for ${meeting.date} at ${meeting.startTime}.`,
        `Assigned room: ${meeting.roomName || 'Executive Boardroom'}.`,
        `Bilingual PDF & DOCX export enabled for attendees.`,
      ],
      translatedExecutive: {
        Welsh: `Briff cyfarfod gweithredol ar gyfer "${meeting.title}" a drefnwyd ar gyfer ${meeting.date} (${meeting.startTime} - ${meeting.endTime}) yn ${meeting.roomName || 'Microsoft Teams'}. Amcan: ${meeting.objective || 'Datblygu safonau gweithredol dwyieithog a chydweithio Teams'}. Prif fynychwyr: ${speakerNames.join(', ')}.`,
        English: execBrief,
        Spanish: `Informe ejecutivo para "${meeting.title}" programado para el ${meeting.date} en ${meeting.roomName}.`,
        French: `Compte-rendu exécutif pour "${meeting.title}" prévu le ${meeting.date} dans ${meeting.roomName}.`,
        German: `Management-Briefing für "${meeting.title}" am ${meeting.date} im ${meeting.roomName}.`,
        Hindi: `"${meeting.title}" के लिए कार्यकारी बैठक विवरण जो ${meeting.date} को ${meeting.roomName} में निर्धारित है।`,
      },
    },
    availableLanguages: ['English', 'Welsh', 'French', 'Spanish', 'German', 'Hindi'],
    activeTargetLanguage: targetLang,
  };
}

/**
 * Professional PDF Export using jsPDF
 */
export async function exportToPDF(recording: RecordingResult, targetLang: string) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 18) {
      doc.addPage();
      y = 18;
      drawFooter();
    }
  };

  const drawFooter = () => {
    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 150, 165);
    doc.text(
      `Voice Studio AI Report  •  ${recording.title}  •  Page ${pageCount}`,
      margin,
      pageHeight - 10
    );
    doc.text('Confidential & Generated with AI', pageWidth - margin, pageHeight - 10, {
      align: 'right',
    });
  };

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, contentWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('VOICE STUDIO | STIWDIO LLAIS', margin + 6, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(190, 205, 225);
  doc.text('MULTILINGUAL MEETING REPORT & BILINGUAL TRANSCRIPTION', margin + 6, y + 16);

  y += 30;

  // Title & Metadata Box
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  const titleLines = doc.splitTextToSize(recording.title, contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 6.5 + 2;

  // Rich Metadata Details Box (Date, Time, Room, Attendees, Languages)
  const metaBoxHeight = 23;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, metaBoxHeight, 2, 2, 'F');

  // Row 1
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('MEETING DATE & TIME:', margin + 4, y + 5);
  doc.text('LOCATION / ROOM:', margin + 70, y + 5);
  doc.text('DURATION:', margin + 130, y + 5);
  doc.text('STATUS:', margin + 155, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  const dateStr = recording.date
    ? `${recording.date} ${recording.createdAt ? `(${recording.createdAt})` : ''}`
    : (recording.createdAt || new Date().toLocaleDateString());
  doc.text(dateStr.length > 30 ? dateStr.slice(0, 28) + '..' : dateStr, margin + 4, y + 9.5);
  const roomStr = recording.roomName || 'Microsoft Teams Hybrid Room';
  doc.text(roomStr.length > 28 ? roomStr.slice(0, 26) + '..' : roomStr, margin + 70, y + 9.5);
  doc.text(recording.durationFormatted || '00:00', margin + 130, y + 9.5);
  doc.text(recording.overallSentiment || 'Confirmed', margin + 155, y + 9.5);

  // Row 2
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('ATTENDEES & SPEAKERS:', margin + 4, y + 15);
  doc.text('ORIGINAL LANG:', margin + 130, y + 15);
  doc.text('TARGET LANG:', margin + 155, y + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  const speakersList = recording.speakersList?.join(', ') || Array.from(new Set(recording.segments?.map((s) => s.speaker) || [])).join(', ') || 'Nisha Bhatt, Carys Evans, Gareth Thomas';
  doc.text(speakersList.length > 62 ? speakersList.slice(0, 59) + '...' : speakersList, margin + 4, y + 19.5);
  doc.text(recording.sourceLanguage || 'English', margin + 130, y + 19.5);
  doc.text(targetLang || 'Welsh', margin + 155, y + 19.5);

  y += metaBoxHeight + 5;

  // Meeting Objective Banner (if present)
  if (recording.objective) {
    checkPageBreak(18);
    doc.setFillColor(240, 253, 250); // cyan-50
    doc.setDrawColor(204, 251, 241);
    doc.roundedRect(margin, y, contentWidth, 12, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 118, 110);
    doc.text('MEETING OBJECTIVE:', margin + 4, y + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(19, 78, 74);
    const objText = doc.splitTextToSize(recording.objective, contentWidth - 8);
    doc.text(objText, margin + 4, y + 8.5);
    y += 15;
  }

  // Meeting Agenda & Schedule (if present)
  if (recording.agenda && recording.agenda.length > 0) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('Meeting Agenda & Session Schedule', margin, y);
    y += 4.5;

    for (const ag of recording.agenda) {
      checkPageBreak(10);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, y, contentWidth, 8, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(14, 116, 144);
      doc.text(`[${ag.durationMinutes || 15}m]  ${ag.title}`, margin + 4, y + 5);
      if (ag.presenter) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(`Presenter: ${ag.presenter}`, contentWidth - 10, y + 5, { align: 'right' });
      }
      y += 9.5;
    }
    y += 3;
  }

  // Section: Executive Summary
  checkPageBreak(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Executive Overview (TL;DR)', margin, y);
  y += 5;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);

  const execSummary = recording.summary.executive || 'No executive summary available.';
  const execLines = doc.splitTextToSize(execSummary, contentWidth - 8);
  const execBoxHeight = execLines.length * 4.8 + 8;

  checkPageBreak(execBoxHeight);
  doc.roundedRect(margin, y, contentWidth, execBoxHeight, 2, 2, 'FD');
  doc.text(execLines, margin + 4, y + 6);
  y += execBoxHeight + 6;

  // Translated Executive Summary if available
  const translatedExec =
    recording.summary.translatedExecutive?.[targetLang] ||
    (recording.summary as any)[targetLang];
  if (translatedExec && targetLang !== recording.sourceLanguage) {
    checkPageBreak(35);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(59, 130, 246);
    doc.text(`Executive Overview in ${targetLang}`, margin, y);
    y += 5;

    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(191, 219, 254);
    const transExecLines = doc.splitTextToSize(translatedExec, contentWidth - 8);
    const transBoxHeight = transExecLines.length * 4.8 + 8;

    checkPageBreak(transBoxHeight);
    doc.roundedRect(margin, y, contentWidth, transBoxHeight, 2, 2, 'FD');
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(30, 58, 138);
    doc.text(transExecLines, margin + 4, y + 6);
    y += transBoxHeight + 6;
  }

  // Section: Key Takeaways
  if (recording.summary.keyPoints && recording.summary.keyPoints.length > 0) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('2. Key Takeaways & Highlights', margin, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);

    for (const point of recording.summary.keyPoints) {
      const pointLines = doc.splitTextToSize(`• ${point}`, contentWidth - 4);
      checkPageBreak(pointLines.length * 4.5 + 2);
      doc.text(pointLines, margin + 2, y);
      y += pointLines.length * 4.5 + 2;
    }
    y += 4;
  }

  // Section: Action Items
  if (recording.summary.actionItems && recording.summary.actionItems.length > 0) {
    checkPageBreak(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('3. Action Items & Next Steps', margin, y);
    y += 6;

    for (const item of recording.summary.actionItems) {
      checkPageBreak(14);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, 11, 1.5, 1.5, 'FD');

      // Priority badge
      const pColor =
        item.priority === 'High'
          ? [239, 68, 68]
          : item.priority === 'Medium'
          ? [245, 158, 11]
          : [59, 130, 246];
      doc.setFillColor(pColor[0], pColor[1], pColor[2]);
      doc.roundedRect(margin + 3, y + 2.5, 14, 6, 1, 1, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.text(item.priority.toUpperCase(), margin + 10, y + 6.5, { align: 'center' });

      // Owner tag
      if (item.owner) {
        doc.setFillColor(224, 231, 255);
        doc.roundedRect(margin + 20, y + 2.5, 28, 6, 1, 1, 'F');
        doc.setTextColor(67, 56, 202);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        const ownerShort = item.owner.length > 18 ? item.owner.slice(0, 16) + '..' : item.owner;
        doc.text(ownerShort, margin + 34, y + 6.5, { align: 'center' });
      }

      // Task text
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      const taskX = item.owner ? margin + 52 : margin + 21;
      const availableW = contentWidth - (item.owner ? 55 : 24);
      const taskText = item.task.length > 80 ? item.task.slice(0, 77) + '...' : item.task;
      doc.text(taskText, taskX, y + 6.5);

      y += 13;
    }
    y += 4;
  }

  // Section: Full Timestamped & Translated Dialogue
  if (recording.segments && recording.segments.length > 0) {
    checkPageBreak(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`4. Full Timestamped Dialogue (${recording.sourceLanguage} + ${targetLang})`, margin, y);
    y += 7;

    for (const seg of recording.segments) {
      const origLines = doc.splitTextToSize(seg.originalText, contentWidth - 10);
      const transText = seg.translations?.[targetLang] || '';
      const transLines = transText ? doc.splitTextToSize(`[${targetLang}] ` + transText, contentWidth - 10) : [];
      const totalSegHeight = 7 + origLines.length * 4.2 + (transLines.length > 0 ? transLines.length * 4.2 + 3 : 0) + 4;

      checkPageBreak(totalSegHeight);

      // Segment box
      doc.setFillColor(252, 253, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, totalSegHeight - 2, 1.5, 1.5, 'FD');

      // Speaker & Timestamp Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(14, 116, 144); // cyan-700
      doc.text(`[${seg.startTime} - ${seg.endTime}]  ${seg.speaker}`, margin + 4, y + 5);

      // Original speech
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(origLines, margin + 5, y + 9.5);

      // Translated speech
      if (transLines.length > 0) {
        const transY = y + 9.5 + origLines.length * 4.2 + 1;
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(37, 99, 235); // blue-600
        doc.text(transLines, margin + 5, transY);
      }

      y += totalSegHeight;
    }
  }

  // Draw footer on each page
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 150, 165);
    doc.text(
      `Voice Studio Report  •  ${recording.title}  •  Page ${i} of ${totalPages}`,
      margin,
      pageHeight - 10
    );
    doc.text('Confidential & Generated with AI', pageWidth - margin, pageHeight - 10, {
      align: 'right',
    });
  }

  // Trigger download
  const filename = `${sanitizeFilename(recording.title)}_${sanitizeFilename(targetLang)}_Report.pdf`;
  doc.save(filename);
}

/**
 * Enterprise DOCX Export using docx package
 */
export async function exportToDocx(recording: RecordingResult, targetLang: string) {
  const children: any[] = [];

  // Title
  children.push(
    new Paragraph({
      text: 'Voice Studio Intelligence Report | Adroddiad Stiwdio Llais',
      heading: HeadingLevel.TITLE,
      spacing: { after: 120 },
    })
  );

  // Subtitle / Document Title
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: recording.title,
          bold: true,
          size: 28,
        }),
      ],
      spacing: { after: 200 },
    })
  );

  // Rich Meeting Metadata
  const docxDateStr = recording.date
    ? `${recording.date} ${recording.createdAt ? `(${recording.createdAt})` : ''}`
    : (recording.createdAt || new Date().toLocaleDateString());
  const docxRoomStr = recording.roomName || 'Microsoft Teams Hybrid Room';
  const docxSpeakersStr = recording.speakersList?.join(', ') || Array.from(new Set(recording.segments?.map((s) => s.speaker) || [])).join(', ') || 'Nisha Bhatt, Carys Evans, Gareth Thomas';

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Meeting Date & Time: ', bold: true }),
        new TextRun({ text: `${docxDateStr}   |   ` }),
        new TextRun({ text: 'Location / Room: ', bold: true }),
        new TextRun({ text: `${docxRoomStr}   |   ` }),
        new TextRun({ text: 'Duration: ', bold: true }),
        new TextRun({ text: `${recording.durationFormatted}` }),
      ],
      spacing: { after: 100 },
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Attendees & Speakers: ', bold: true }),
        new TextRun({ text: `${docxSpeakersStr}   |   ` }),
        new TextRun({ text: 'Original Language: ', bold: true }),
        new TextRun({ text: `${recording.sourceLanguage}   |   ` }),
        new TextRun({ text: 'Target Language: ', bold: true }),
        new TextRun({ text: `${targetLang}` }),
      ],
      spacing: { after: 200 },
    })
  );

  if (recording.objective) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Meeting Objective: ', bold: true, color: '0E7490' }),
          new TextRun({ text: ` ${recording.objective}`, italics: true }),
        ],
        spacing: { after: 180 },
      })
    );
  }

  if (recording.agenda && recording.agenda.length > 0) {
    children.push(
      new Paragraph({
        text: 'Meeting Agenda & Session Schedule',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 180, after: 100 },
      })
    );
    for (const ag of recording.agenda) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `• [${ag.durationMinutes || 15} mins] `, bold: true, color: '0E7490' }),
            new TextRun({ text: `${ag.title} ` }),
            ...(ag.presenter ? [new TextRun({ text: `(Presenter: ${ag.presenter})`, italics: true, color: '64748B' })] : []),
          ],
          spacing: { after: 60 },
        })
      );
    }
  }

  // 1. Executive Summary
  children.push(
    new Paragraph({
      text: '1. Executive Summary (TL;DR)',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 240, after: 120 },
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: recording.summary.executive || 'No executive summary generated.',
        }),
      ],
      spacing: { after: 200 },
    })
  );

  // Translated Executive Summary
  const transExec = recording.summary.translatedExecutive?.[targetLang];
  if (transExec && targetLang !== recording.sourceLanguage) {
    children.push(
      new Paragraph({
        text: `Executive Summary (${targetLang})`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 180, after: 100 },
      })
    );
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: transExec,
            italics: true,
          }),
        ],
        spacing: { after: 200 },
      })
    );
  }

  // 2. Key Highlights
  if (recording.summary.keyPoints && recording.summary.keyPoints.length > 0) {
    children.push(
      new Paragraph({
        text: '2. Key Highlights & Decisions',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 240, after: 120 },
      })
    );

    for (const point of recording.summary.keyPoints) {
      children.push(
        new Paragraph({
          text: `• ${point}`,
          spacing: { after: 80 },
        })
      );
    }
  }

  // 3. Action Items Table
  if (recording.summary.actionItems && recording.summary.actionItems.length > 0) {
    children.push(
      new Paragraph({
        text: '3. Action Items & Assignees',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 240, after: 120 },
      })
    );

    const tableRows = [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 15, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: 'Priority', bold: true })] })],
          }),
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: 'Assignee / Owner', bold: true })] })],
          }),
          new TableCell({
            width: { size: 60, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: 'Action Item / Task', bold: true })] })],
          }),
        ],
      }),
      ...recording.summary.actionItems.map(
        (item) =>
          new TableRow({
            children: [
              new TableCell({
                width: { size: 15, type: WidthType.PERCENTAGE },
                children: [new Paragraph({ text: item.priority })],
              }),
              new TableCell({
                width: { size: 25, type: WidthType.PERCENTAGE },
                children: [new Paragraph({ text: item.owner || 'Unassigned' })],
              }),
              new TableCell({
                width: { size: 60, type: WidthType.PERCENTAGE },
                children: [new Paragraph({ text: item.task })],
              }),
            ],
          })
      ),
    ];

    children.push(
      new Table({
        rows: tableRows,
        width: { size: 100, type: WidthType.PERCENTAGE },
      })
    );
  }

  // 4. Timestamped Transcript & Translations
  if (recording.segments && recording.segments.length > 0) {
    children.push(
      new Paragraph({
        text: `4. Full Dialogue Transcript with Translation (${targetLang})`,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 140 },
      })
    );

    for (const seg of recording.segments) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `[${seg.startTime} - ${seg.endTime}] ${seg.speaker}: `,
              bold: true,
            }),
            new TextRun({
              text: seg.originalText,
            }),
          ],
          spacing: { after: 60 },
        })
      );

      const transText = seg.translations?.[targetLang];
      if (transText) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `↳ [${targetLang}] `,
                bold: true,
                color: '2563EB',
              }),
              new TextRun({
                text: transText,
                italics: true,
                color: '1E3A8A',
              }),
            ],
            indent: { left: 400 },
            spacing: { after: 120 },
          })
        );
      }
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sanitizeFilename(recording.title)}_${sanitizeFilename(targetLang)}_Report.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Standard SRT Subtitles Export
 */
export function exportToSRT(recording: RecordingResult, useTranslation = false, targetLang = 'Spanish') {
  let srtContent = '';
  const segments = recording.segments || [];

  const formatSRTTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    const ms = Math.floor((seconds % 1) * 1000).toString().padStart(3, '0');
    return `${hrs}:${mins}:${secs},${ms}`;
  };

  segments.forEach((seg, idx) => {
    const start = formatSRTTime(seg.startSeconds || idx * 10);
    const end = formatSRTTime(seg.endSeconds || (idx + 1) * 10);
    const text = useTranslation
      ? (seg.translations?.[targetLang] || seg.originalText)
      : seg.originalText;

    srtContent += `${idx + 1}\n${start} --> ${end}\n${seg.speaker ? `${seg.speaker}: ` : ''}${text}\n\n`;
  });

  const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sanitizeFilename(recording.title)}_${useTranslation ? targetLang : 'Original'}.srt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Plain Text Export
 */
export function exportToText(recording: RecordingResult, targetLang: string) {
  let content = `======================================================\n`;
  content += `OMNIVOICE INTELLIGENCE REPORT\n`;
  content += `Title: ${recording.title}\n`;
  content += `Duration: ${recording.durationFormatted}\n`;
  content += `Source Language: ${recording.sourceLanguage}\n`;
  content += `Target Language: ${targetLang}\n`;
  content += `Sentiment: ${recording.overallSentiment}\n`;
  content += `======================================================\n\n`;

  content += `[EXECUTIVE SUMMARY]\n${recording.summary.executive}\n\n`;

  if (recording.summary.translatedExecutive?.[targetLang]) {
    content += `[EXECUTIVE SUMMARY (${targetLang.toUpperCase()})]\n${recording.summary.translatedExecutive[targetLang]}\n\n`;
  }

  content += `[KEY TAKEAWAYS]\n`;
  recording.summary.keyPoints?.forEach((p) => {
    content += `• ${p}\n`;
  });
  content += `\n`;

  content += `[ACTION ITEMS]\n`;
  recording.summary.actionItems?.forEach((a) => {
    content += `[${a.priority}] ${a.owner ? `(${a.owner}) ` : ''}${a.task}\n`;
  });
  content += `\n`;

  content += `[DIALOGUE & TRANSCRIPT]\n`;
  recording.segments?.forEach((seg) => {
    content += `[${seg.startTime} - ${seg.endTime}] ${seg.speaker}:\n  Original: ${seg.originalText}\n`;
    if (seg.translations?.[targetLang]) {
      content += `  ${targetLang}: ${seg.translations[targetLang]}\n`;
    }
    content += `\n`;
  });

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sanitizeFilename(recording.title)}_Transcript.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
