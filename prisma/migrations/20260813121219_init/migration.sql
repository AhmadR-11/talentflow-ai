-- CreateTable
CREATE TABLE "hr_managers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_managers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "hrManagerId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_postings" (
    "id" TEXT NOT NULL,
    "hrManagerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "experienceLevel" TEXT NOT NULL,
    "employmentType" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "requiredSkills" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_postings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_sourcing_config" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "linkedinEnabled" BOOLEAN NOT NULL DEFAULT true,
    "upworkEnabled" BOOLEAN NOT NULL DEFAULT true,
    "indeedEnabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "job_sourcing_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_scoring_weights" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "resumeWeight" INTEGER NOT NULL DEFAULT 30,
    "testWeight" INTEGER NOT NULL DEFAULT 40,
    "interviewWeight" INTEGER NOT NULL DEFAULT 30,

    CONSTRAINT "job_scoring_weights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_status_logs" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "oldStatus" TEXT NOT NULL,
    "newStatus" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_status_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidates" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "location" TEXT,
    "sourcePlatform" TEXT NOT NULL,
    "profileUrl" TEXT,
    "resumeUrl" TEXT,
    "skills" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'sourced',
    "compositeScore" DOUBLE PRECISION,
    "aiSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_scores" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "resumeScore" DOUBLE PRECISION,
    "testScore" DOUBLE PRECISION,
    "interviewScore" DOUBLE PRECISION,
    "compositeScore" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidate_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_submissions" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "score" DOUBLE PRECISION,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_sessions" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "transcript" JSONB NOT NULL,
    "score" DOUBLE PRECISION,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interview_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_status_logs" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "takenBy" TEXT NOT NULL,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidate_status_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_preferences" (
    "id" TEXT NOT NULL,
    "hrManagerId" TEXT NOT NULL,
    "defaultWeights" JSONB NOT NULL DEFAULT '{"resume": 30, "test": 40, "interview": 30}',
    "notifyPipeline" BOOLEAN NOT NULL DEFAULT true,
    "notifyComplete" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "hr_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hr_managers_email_key" ON "hr_managers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "job_sourcing_config_jobId_key" ON "job_sourcing_config"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "job_scoring_weights_jobId_key" ON "job_scoring_weights"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "candidate_scores_candidateId_key" ON "candidate_scores"("candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_submissions_candidateId_key" ON "assessment_submissions"("candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "interview_sessions_candidateId_key" ON "interview_sessions"("candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "hr_preferences_hrManagerId_key" ON "hr_preferences"("hrManagerId");

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_hrManagerId_fkey" FOREIGN KEY ("hrManagerId") REFERENCES "hr_managers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_hrManagerId_fkey" FOREIGN KEY ("hrManagerId") REFERENCES "hr_managers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_sourcing_config" ADD CONSTRAINT "job_sourcing_config_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "job_postings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_scoring_weights" ADD CONSTRAINT "job_scoring_weights_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "job_postings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_status_logs" ADD CONSTRAINT "job_status_logs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "job_postings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "job_postings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_scores" ADD CONSTRAINT "candidate_scores_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_submissions" ADD CONSTRAINT "assessment_submissions_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_status_logs" ADD CONSTRAINT "candidate_status_logs_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_preferences" ADD CONSTRAINT "hr_preferences_hrManagerId_fkey" FOREIGN KEY ("hrManagerId") REFERENCES "hr_managers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
