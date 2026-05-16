import { jsPDF } from 'npm:jspdf@4.2.1';

Deno.serve(async (req) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

    // Heading
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('Task List from Launchpad App', 20, yPos);
    yPos += 15;

    // Date
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, yPos);
    yPos += 10;

    // Tasks
    const tasks = [
      {
        title: 'Admin Dashboard (HowToAdmin page)',
        category: 'Build',
        priority: 'Medium',
        status: 'In Progress',
        blocked: 'Not yet started',
        description: 'The HowToAdmin page exists and loads HowToAnswer entities, but the CRUD form UI is incomplete—the create/edit form is stubbed but doesn\'t fully render the answer editor or validation. The delete functionality exists but the form UX needs polish.'
      },
      {
        title: 'Employee Data Population',
        category: 'Data Entry',
        priority: 'High',
        status: 'Pending',
        blocked: 'Manual admin action required',
        description: 'The Employee entity is defined and queries are working, but no employee records have been created. The app requires at least one employee record linked to each user\'s email for authorization levels and app access to function properly.'
      },
      {
        title: 'AppRegistration Entity Usage',
        category: 'Build',
        priority: 'Medium',
        status: 'Pending',
        blocked: 'Not yet started',
        description: 'The AppRegistration entity exists in the schema but is never queried or used in the app. Currently apps load from the external Beacon hub config. The local AppRegistration entity is orphaned and should either be removed or integrated as a fallback/override mechanism.'
      },
      {
        title: 'HowToAnswer Bulk Seeding',
        category: 'Data Entry',
        priority: 'Low',
        status: 'Pending',
        blocked: 'Manual admin action required',
        description: 'The HowToAnswer entity exists but is empty. Sample how-to entries need to be created via the HowToAdmin page to populate the knowledge base for the HowToSearch component.'
      },
      {
        title: 'PersonalOrganizer Data Seeding',
        category: 'Data Entry',
        priority: 'Low',
        status: 'Pending',
        blocked: 'Manual user action at runtime',
        description: 'The PersonalOrganizer entity is defined but empty. Users can create their own organizer data via the OrganizerPanel widget, but no initial/sample data exists to demonstrate the feature.'
      },
      {
        title: 'Authorization Level Enforcement',
        category: 'Build',
        priority: 'High',
        status: 'Pending',
        blocked: 'Employee records must be created first',
        description: 'AppCard and AppGrid check authorization_level but enforcement logic is incomplete—no backend RLS or page-level access control exists to prevent unauthorized direct URL access to restricted apps.'
      },
      {
        title: 'App Access Control (app_access / admin_apps)',
        category: 'Build',
        priority: 'Medium',
        status: 'In Progress',
        blocked: 'Employee records must be created first',
        description: 'The Employee entity has app_access and admin_apps arrays, and AppCard reads them, but there is no comprehensive access control system to filter apps or enforce permissions at the routing/API level.'
      }
    ];

    doc.setFontSize(11);
    doc.setTextColor(0);

    tasks.forEach((task, idx) => {
      // Check if we need a new page
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = 20;
      }

      // Task number and title
      doc.setFont(undefined, 'bold');
      doc.text(`${idx + 1}. ${task.title}`, 20, yPos);
      yPos += 7;

      // Details
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      doc.setTextColor(60);
      doc.text(`Category: ${task.category} | Priority: ${task.priority} | Status: ${task.status}`, 20, yPos);
      yPos += 5;
      doc.text(`Blocked By: ${task.blocked}`, 20, yPos);
      yPos += 6;

      // Description (wrapped)
      doc.setTextColor(0);
      const descLines = doc.splitTextToSize(task.description, pageWidth - 40);
      doc.text(descLines, 20, yPos);
      yPos += descLines.length * 4.5 + 6;
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Nexus Launchpad', 20, pageHeight - 10);

    const pdfBytes = doc.output('arraybuffer');
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=task-list-launchpad.pdf'
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});