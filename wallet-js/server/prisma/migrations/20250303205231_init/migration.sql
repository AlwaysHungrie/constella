-- CreateTable
CREATE TABLE "User" (
    "userAddress" TEXT NOT NULL,
    "privyUserId" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("userAddress")
);

-- CreateTable
CREATE TABLE "AgentWallet" (
    "walletAddress" TEXT NOT NULL,
    "privateKey" TEXT NOT NULL,
    "creatorAddress" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "dbName" TEXT NOT NULL,
    "dbUser" TEXT NOT NULL,
    "dbPassword" TEXT NOT NULL,
    "dbHost" TEXT NOT NULL,
    "dbPort" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentWallet_pkey" PRIMARY KEY ("walletAddress")
);

-- CreateTable
CREATE TABLE "AgentFunction" (
    "functionId" TEXT NOT NULL,
    "functionName" TEXT NOT NULL,
    "agentWalletAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentFunction_pkey" PRIMARY KEY ("functionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_privyUserId_key" ON "User"("privyUserId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentFunction_functionName_key" ON "AgentFunction"("functionName");

-- AddForeignKey
ALTER TABLE "AgentWallet" ADD CONSTRAINT "AgentWallet_creatorAddress_fkey" FOREIGN KEY ("creatorAddress") REFERENCES "User"("userAddress") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentFunction" ADD CONSTRAINT "AgentFunction_agentWalletAddress_fkey" FOREIGN KEY ("agentWalletAddress") REFERENCES "AgentWallet"("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE;
