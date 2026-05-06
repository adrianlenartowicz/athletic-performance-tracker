-- CreateTable
CREATE TABLE "PhysiotherapistReport" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Ocena fizjoterapeutyczna',
    "observations" TEXT[],
    "recommendations" TEXT[],
    "comparisonToPrevious" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhysiotherapistReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PhysiotherapistReport_childId_idx" ON "PhysiotherapistReport"("childId");

-- CreateIndex
CREATE INDEX "PhysiotherapistReport_reportDate_idx" ON "PhysiotherapistReport"("reportDate");

-- AddForeignKey
ALTER TABLE "PhysiotherapistReport" ADD CONSTRAINT "PhysiotherapistReport_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
