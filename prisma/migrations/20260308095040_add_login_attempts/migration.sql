-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "email" TEXT,
    "ip" TEXT,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LoginAttempt_email_idx" ON "LoginAttempt"("email");

-- CreateIndex
CREATE INDEX "LoginAttempt_ip_idx" ON "LoginAttempt"("ip");

-- CreateIndex
CREATE UNIQUE INDEX "LoginAttempt_key_windowStart_key" ON "LoginAttempt"("key", "windowStart");
