-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('CREATED', 'ACTIVE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED');

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "brand" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "description" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'CREATED',

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "walletAddress" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LootBox" (
    "id" TEXT NOT NULL,
    "dateOpened" TIMESTAMP(3),
    "lootId" TEXT,
    "claimedById" TEXT,
    "lootNftId" TEXT,
    "eventId" TEXT NOT NULL,
    "locationId" TEXT,

    CONSTRAINT "LootBox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Loot" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "totalSupply" INTEGER NOT NULL,
    "circulatingSupply" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Loot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "address" TEXT,
    "positionName" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "transactionHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "lootId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryAddress" (
    "id" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "orderId" INTEGER NOT NULL,

    CONSTRAINT "DeliveryAddress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "LootBox_lootNftId_key" ON "LootBox"("lootNftId");

-- CreateIndex
CREATE UNIQUE INDEX "LootBox_locationId_key" ON "LootBox"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_transactionHash_key" ON "Order"("transactionHash");

-- CreateIndex
CREATE UNIQUE INDEX "Order_userId_key" ON "Order"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryAddress_orderId_key" ON "DeliveryAddress"("orderId");

-- AddForeignKey
ALTER TABLE "LootBox" ADD CONSTRAINT "LootBox_lootId_fkey" FOREIGN KEY ("lootId") REFERENCES "Loot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LootBox" ADD CONSTRAINT "LootBox_claimedById_fkey" FOREIGN KEY ("claimedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LootBox" ADD CONSTRAINT "LootBox_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LootBox" ADD CONSTRAINT "LootBox_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_lootId_fkey" FOREIGN KEY ("lootId") REFERENCES "Loot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryAddress" ADD CONSTRAINT "DeliveryAddress_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
