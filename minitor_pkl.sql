-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jul 06, 2026 at 06:02 AM
-- Server version: 8.0.30
-- PHP Version: 8.1.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `minitor_pkl`
--

-- --------------------------------------------------------

--
-- Table structure for table `advisornote`
--

CREATE TABLE `advisornote` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `advisorName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `text` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `studentId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `advisorId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `card`
--

CREATE TABLE `card` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `columnId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'rencana',
  `category` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Coding',
  `hoursLogged` int NOT NULL DEFAULT '0',
  `dueDate` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `score` int DEFAULT NULL,
  `feedback` text COLLATE utf8mb4_unicode_ci,
  `studentId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `card`
--

INSERT INTO `card` (`id`, `title`, `description`, `columnId`, `category`, `hoursLogged`, `dueDate`, `createdAt`, `score`, `feedback`, `studentId`) VALUES
('1a18d17c-fe0f-45e0-a4cf-ad3c241a5440', 'Belajar', '', 'selesai', 'Coding', 0, '2026-07-13', '2026-07-06 01:15:12.962', NULL, NULL, '83e2015a-c524-4bb1-b071-57325d6ec591'),
('aad2f699-48e4-42f0-a4df-23c6d311836f', 'Belajar Desain Poster', 'Hebat\n', 'selesai', 'Design', 0, '2026-07-13', '2026-07-06 01:14:33.670', NULL, NULL, '83e2015a-c524-4bb1-b071-57325d6ec591'),
('c0d2efce-3c94-4797-b051-f22abad394ce', 'Belajar Vibe Coding', 'tingkatkan terus belajarnya', 'review', 'Coding', 6, '2026-07-12', '2026-07-05 02:47:27.312', 80, '', '83e2015a-c524-4bb1-b071-57325d6ec591'),
('c93fc51d-3841-4ade-b61b-dc8db2476ee1', 'Belajar Animasi', '.', 'progres', 'Design', 0, '2026-07-13', '2026-07-06 01:14:12.118', NULL, '', '83e2015a-c524-4bb1-b071-57325d6ec591');

-- --------------------------------------------------------

--
-- Table structure for table `comment`
--

CREATE TABLE `comment` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `text` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `cardId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `comment`
--

INSERT INTO `comment` (`id`, `userName`, `role`, `text`, `createdAt`, `cardId`) VALUES
('b0c2c0de-4043-4253-be56-20075a9c3e13', 'marup', 'Mahasiswa', 'Hebat', '2026-07-06 01:15:30.703', '1a18d17c-fe0f-45e0-a4cf-ad3c241a5440'),
('b8be7622-fa42-47a1-b5cc-3800dd041bc8', 'guru', 'Mentor', 'lumayan', '2026-07-06 01:17:41.540', '1a18d17c-fe0f-45e0-a4cf-ad3c241a5440');

-- --------------------------------------------------------

--
-- Table structure for table `historyitem`
--

CREATE TABLE `historyitem` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `text` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `cardId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `historyitem`
--

INSERT INTO `historyitem` (`id`, `text`, `createdAt`, `cardId`) VALUES
('0a99b544-e718-4f71-8de2-56ba3caeab79', 'Status dipindahkan dari [Sedang Dikerjakan] ke [Rencana Kegiatan] oleh mentor (Dosen Pembimbing)', '2026-07-06 01:18:54.734', 'aad2f699-48e4-42f0-a4df-23c6d311836f'),
('1285f172-9c66-4b44-b436-9fc089a7a039', 'Status dipindahkan dari [Sedang Dikerjakan] ke [Butuh Review] oleh marup (Mahasiswa)', '2026-07-06 01:14:17.867', 'c0d2efce-3c94-4797-b051-f22abad394ce'),
('27c44f3f-db04-4924-8f33-7740b0c6c361', 'Card dibuat oleh marup (Mahasiswa)', '2026-07-06 01:14:12.118', 'c93fc51d-3841-4ade-b61b-dc8db2476ee1'),
('2a51d1b2-17bb-41df-81f9-249065fbc8f2', 'Detail kartu diperbarui oleh mentor (Dosen Pembimbing)', '2026-07-06 01:20:38.774', 'c0d2efce-3c94-4797-b051-f22abad394ce'),
('2f8f1b79-8100-47e1-a0ef-9d1d1488a63f', 'marup (Mahasiswa) menambahkan komentar', '2026-07-06 01:15:30.715', '1a18d17c-fe0f-45e0-a4cf-ad3c241a5440'),
('5ab1ce6b-ee1e-486e-ad4c-ccb064fbe7aa', 'Status dipindahkan dari [Selesai (Disetujui)] ke [Butuh Review] oleh marup (Mahasiswa)', '2026-07-06 01:14:54.460', 'c0d2efce-3c94-4797-b051-f22abad394ce'),
('6889c444-6454-4755-8e74-4efb186ffd2f', 'Status dipindahkan dari [Rencana Kegiatan] ke [Selesai (Disetujui)] oleh mentor (Dosen Pembimbing)', '2026-07-06 01:18:57.488', 'aad2f699-48e4-42f0-a4df-23c6d311836f'),
('6fc2ce23-1a14-4dca-9cee-3f81c64672f0', 'Status dipindahkan dari [Sedang Dikerjakan] ke [Selesai (Disetujui)] oleh marup (Mahasiswa)', '2026-07-05 02:47:53.443', 'c0d2efce-3c94-4797-b051-f22abad394ce'),
('78f096a0-0245-45ae-8a1e-bfaec50e9fc7', 'Card dibuat oleh marup (Mahasiswa)', '2026-07-06 01:14:33.670', 'aad2f699-48e4-42f0-a4df-23c6d311836f'),
('8ae4a58d-ab17-44de-b285-5365a585c3a9', 'Status dipindahkan dari [Rencana Kegiatan] ke [Sedang Dikerjakan] oleh marup (Mahasiswa)', '2026-07-05 02:47:33.685', 'c0d2efce-3c94-4797-b051-f22abad394ce'),
('8d76a5a6-8305-43d4-93ea-99940c269711', 'Card dibuat oleh marup (Mahasiswa)', '2026-07-05 02:47:27.312', 'c0d2efce-3c94-4797-b051-f22abad394ce'),
('9557fa1f-5292-44d8-8e7d-d249e2411268', 'Status dipindahkan dari [Selesai (Disetujui)] ke [Sedang Dikerjakan] oleh marup (Mahasiswa)', '2026-07-05 02:47:59.009', 'c0d2efce-3c94-4797-b051-f22abad394ce'),
('99722148-9daa-4da5-bf2a-eff1a4703a90', 'Card dibuat oleh marup (Mahasiswa)', '2026-07-06 01:15:12.962', '1a18d17c-fe0f-45e0-a4cf-ad3c241a5440'),
('b4488f6f-812c-4ced-86c3-11e4e37057ce', 'Status dipindahkan dari [Butuh Review] ke [Sedang Dikerjakan] oleh marup (Mahasiswa)', '2026-07-05 02:47:51.308', 'c0d2efce-3c94-4797-b051-f22abad394ce'),
('b5637bca-fb3a-489b-99d9-a0e8c56b45c7', 'Status dipindahkan dari [Butuh Review] ke [Selesai (Disetujui)] oleh marup (Mahasiswa)', '2026-07-06 01:14:51.692', 'c0d2efce-3c94-4797-b051-f22abad394ce'),
('bdf6e630-9232-4a15-94d6-26d6f569ac36', 'Detail kartu diperbarui oleh marup (Mahasiswa)', '2026-07-06 01:16:34.671', 'c93fc51d-3841-4ade-b61b-dc8db2476ee1'),
('eac7a16d-d65e-4901-a1b0-143121ba7147', 'Detail kartu diperbarui oleh marup (Mahasiswa)', '2026-07-06 01:16:18.070', 'aad2f699-48e4-42f0-a4df-23c6d311836f'),
('f5c72d29-69f1-4fed-aa29-953ea07867dd', 'Status dipindahkan dari [Sedang Dikerjakan] ke [Butuh Review] oleh marup (Mahasiswa)', '2026-07-05 02:47:41.302', 'c0d2efce-3c94-4797-b051-f22abad394ce'),
('fa8a8a3c-4686-41f6-824f-ef2b89a58aac', 'guru (Mentor) menambahkan komentar', '2026-07-06 01:17:41.549', '1a18d17c-fe0f-45e0-a4cf-ad3c241a5440');

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `school` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SMKN 1 BOJONG',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`id`, `username`, `password`, `name`, `role`, `company`, `school`, `createdAt`) VALUES
('83e2015a-c524-4bb1-b071-57325d6ec591', 'marup', '17f80754644d33ac685b0842a402229adbb43fc9312f7bdf36ba24237a1f1ffb', 'marup', 'siswa', 'telkom', 'SMKN 1 BOJONG', '2026-07-05 02:46:16.810'),
('e723c4dd-a703-4b7f-9358-50d55d60cb5b', 'guru', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'guru', 'pembimbing_eksternal', 'telkom', 'SMKN 1 BOJONG', '2026-07-06 01:17:09.911'),
('f9adce63-cb65-4679-abc4-0274429764b6', 'mentor', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'mentor', 'pembimbing_internal', NULL, 'SMKN 1 BOJONG', '2026-07-06 01:18:31.679');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `advisornote`
--
ALTER TABLE `advisornote`
  ADD PRIMARY KEY (`id`),
  ADD KEY `AdvisorNote_studentId_idx` (`studentId`),
  ADD KEY `AdvisorNote_advisorId_idx` (`advisorId`);

--
-- Indexes for table `card`
--
ALTER TABLE `card`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Card_studentId_idx` (`studentId`);

--
-- Indexes for table `comment`
--
ALTER TABLE `comment`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Comment_cardId_idx` (`cardId`);

--
-- Indexes for table `historyitem`
--
ALTER TABLE `historyitem`
  ADD PRIMARY KEY (`id`),
  ADD KEY `HistoryItem_cardId_idx` (`cardId`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `User_username_key` (`username`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `advisornote`
--
ALTER TABLE `advisornote`
  ADD CONSTRAINT `AdvisorNote_advisorId_fkey` FOREIGN KEY (`advisorId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `AdvisorNote_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `card`
--
ALTER TABLE `card`
  ADD CONSTRAINT `Card_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `comment`
--
ALTER TABLE `comment`
  ADD CONSTRAINT `Comment_cardId_fkey` FOREIGN KEY (`cardId`) REFERENCES `card` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `historyitem`
--
ALTER TABLE `historyitem`
  ADD CONSTRAINT `HistoryItem_cardId_fkey` FOREIGN KEY (`cardId`) REFERENCES `card` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
