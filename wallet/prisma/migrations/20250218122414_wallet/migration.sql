-- CreateTable
CREATE TABLE "Wallet" (
    "walletAddress" TEXT NOT NULL,
    "privateKey" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("walletAddress")
);
