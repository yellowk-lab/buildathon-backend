-- CreateTable
CREATE TABLE "Crate" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "positionName" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "qrCodeId" INTEGER,

    CONSTRAINT "Crate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QRCode" (
    "id" SERIAL NOT NULL,
    "hash" TEXT NOT NULL,
    "crateId" INTEGER,

    CONSTRAINT "QRCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" SERIAL NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "name" TEXT,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "drawPrizeRegistered" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LootBox" (
    "id" TEXT NOT NULL,
    "isOpened" BOOLEAN NOT NULL DEFAULT false,
    "dateOpened" TIMESTAMP(3),
    "lootId" INTEGER,
    "openedById" INTEGER,
    "eventId" INTEGER NOT NULL,
    "qrCodeId" INTEGER,

    CONSTRAINT "LootBox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Loot" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "totalSupply" INTEGER NOT NULL,
    "circulatingSupply" INTEGER NOT NULL,

    CONSTRAINT "Loot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QRScanEvent" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "qrCodeId" INTEGER NOT NULL,

    CONSTRAINT "QRScanEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Crate_qrCodeId_key" ON "Crate"("qrCodeId");

-- CreateIndex
CREATE UNIQUE INDEX "QRCode_hash_key" ON "QRCode"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Loot_name_key" ON "Loot"("name");

-- AddForeignKey
ALTER TABLE "Crate" ADD CONSTRAINT "Crate_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "QRCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LootBox" ADD CONSTRAINT "LootBox_lootId_fkey" FOREIGN KEY ("lootId") REFERENCES "Loot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LootBox" ADD CONSTRAINT "LootBox_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LootBox" ADD CONSTRAINT "LootBox_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LootBox" ADD CONSTRAINT "LootBox_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "QRCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRScanEvent" ADD CONSTRAINT "QRScanEvent_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "QRCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
