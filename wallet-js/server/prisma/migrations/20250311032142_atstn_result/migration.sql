-- CreateTable
CREATE TABLE "Attestations" (
    "attestationHash" TEXT NOT NULL,
    "isSystemPromptValid" BOOLEAN NOT NULL,
    "result" TEXT NOT NULL,
    "functionCalls" TEXT[],
    "jsonResponses" TEXT[],
    "transactionHashes" TEXT[],

    CONSTRAINT "Attestations_pkey" PRIMARY KEY ("attestationHash")
);
