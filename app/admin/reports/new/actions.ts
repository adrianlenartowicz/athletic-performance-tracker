'use server';

import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function createReport(formData: FormData) {
  await requireAdmin();

  const childId = formData.get('childId') as string;
  const reportDateInput = formData.get('reportDate') as string;
  const observations = (formData.getAll('observations') as string[]).map((s) => s.trim()).filter(Boolean);
  const recommendations = (formData.getAll('recommendations') as string[]).map((s) => s.trim()).filter(Boolean);
  const comparisonToPrevious = ((formData.get('comparisonToPrevious') as string) ?? '').trim() || null;

  if (!childId) throw new Error('Child is required.');
  if (!reportDateInput) throw new Error('Report date is required.');

  const reportDate = new Date(reportDateInput);
  if (isNaN(reportDate.getTime())) throw new Error('Invalid report date.');
  if (observations.length === 0) throw new Error('At least one observation is required.');
  if (recommendations.length === 0) throw new Error('At least one recommendation is required.');

  const child = await prisma.child.findUnique({
    where: { id: childId },
    select: { id: true },
  });

  if (!child) throw new Error('Child not found.');

  await prisma.physiotherapistReport.create({
    data: {
      childId,
      reportDate,
      observations,
      recommendations,
      comparisonToPrevious,
    },
  });

  redirect('/admin?report=created');
}
