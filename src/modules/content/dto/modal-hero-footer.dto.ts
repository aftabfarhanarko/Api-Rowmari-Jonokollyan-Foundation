import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsDateString, IsInt, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// --- 1. Notice Modal DTOs ---
export class CreateNoticeModalDto {
  @ApiPropertyOptional({ example: 'জরুরি জনকল্যাণ নোটিশ ও ঘোষণা' })
  @IsOptional()
  @IsString()
  headerTitle?: string;

  @ApiPropertyOptional({ example: 'শীতবস্ত্র ও জরুরি মানবিক ত্রাণ ঘোষণা' })
  @IsOptional()
  @IsString()
  badge?: string;

  @ApiProperty({ example: 'রৌমারী ও দুর্গম চরাঞ্চলের শীতার্ত পরিবারের পাশে দাঁড়ান' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'তীব্র শীতে রৌমারীর ব্রহ্মপুত্র নদের দুর্গম চরাঞ্চলের অসহায় পরিবারের মাঝে কম্বল ও শীতবস্ত্র বিতরণ...' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: '+880 1712-345678' })
  @IsOptional()
  @IsString()
  hotline?: string;

  @ApiPropertyOptional({ example: 'ভোলামোড়, রৌমারী উপজেলা, রংপুর, বাংলাদেশ (৫৬৪০)' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'অনুদান দিন' })
  @IsOptional()
  @IsString()
  primaryBtnText?: string;

  @ApiPropertyOptional({ example: '/donate' })
  @IsOptional()
  @IsString()
  primaryBtnLink?: string;

  @ApiPropertyOptional({ example: 'স্বেচ্ছাসেবক হন' })
  @IsOptional()
  @IsString()
  secondaryBtnText?: string;

  @ApiPropertyOptional({ example: '/volunteer' })
  @IsOptional()
  @IsString()
  secondaryBtnLink?: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/...' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: '2026-11-20T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2027-02-28T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'ONCE_PER_DAY' })
  @IsOptional()
  @IsString()
  displayFrequency?: string;
}

export class UpdateNoticeModalDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  headerTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  badge?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hotline?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  primaryBtnText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  primaryBtnLink?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  secondaryBtnText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  secondaryBtnLink?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  displayFrequency?: string;
}

// --- 2. Hero Slide DTOs ---
export class CreateHeroSlideDto {
  @ApiProperty({ example: 'মানুষের পাশে, মানুষের জন্য' })
  @IsString()
  @IsNotEmpty()
  titleBn: string;

  @ApiPropertyOptional({ example: 'Standing by People, For Humanity' })
  @IsOptional()
  @IsString()
  titleEn?: string;

  @ApiProperty({ example: 'রৌমারী ও ব্রহ্মপুত্রের দুর্গম চরাঞ্চলের অসহায় শীতার্ত মানুষের পাশে দাঁড়ানোই আমাদের কাজ...' })
  @IsString()
  @IsNotEmpty()
  subtitleBn: string;

  @ApiPropertyOptional({ example: 'Dedicated to serving the underprivileged in Rowmari...' })
  @IsOptional()
  @IsString()
  subtitleEn?: string;

  @ApiPropertyOptional({ example: 'স্থাপিত ২০১৮ • রৌমারী, কুড়িগ্রাম • ৯ম বছরে পদার্পণ' })
  @IsOptional()
  @IsString()
  badgeBn?: string;

  @ApiPropertyOptional({ example: 'Est. 2018 • Rowmari, Kurigram' })
  @IsOptional()
  @IsString()
  badgeEn?: string;

  @ApiPropertyOptional({ example: 'মানবিক সহায়তা মিশন' })
  @IsOptional()
  @IsString()
  categoryBn?: string;

  @ApiPropertyOptional({ example: 'Humanitarian Mission' })
  @IsOptional()
  @IsString()
  categoryEn?: string;

  @ApiProperty({ example: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1800&q=85' })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @ApiPropertyOptional({ example: 'অনুদান দিন' })
  @IsOptional()
  @IsString()
  btnPrimaryBn?: string;

  @ApiPropertyOptional({ example: 'Donate Now' })
  @IsOptional()
  @IsString()
  btnPrimaryEn?: string;

  @ApiPropertyOptional({ example: '/donate' })
  @IsOptional()
  @IsString()
  btnPrimaryLink?: string;

  @ApiPropertyOptional({ example: 'কার্যক্রম দেখুন' })
  @IsOptional()
  @IsString()
  btnSecondaryBn?: string;

  @ApiPropertyOptional({ example: 'Explore Activities' })
  @IsOptional()
  @IsString()
  btnSecondaryEn?: string;

  @ApiPropertyOptional({ example: '/activities' })
  @IsOptional()
  @IsString()
  btnSecondaryLink?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  displayOrder?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateHeroSlideDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleBn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subtitleBn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subtitleEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  badgeBn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  badgeEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryBn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  btnPrimaryBn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  btnPrimaryEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  btnPrimaryLink?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  btnSecondaryBn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  btnSecondaryEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  btnSecondaryLink?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  displayOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// --- 3. Footer Config DTO ---
export class UpdateFooterConfigDto {
  @ApiPropertyOptional({ example: 'রৌমারী জনকল্যাণ ফাউন্ডেশন রৌমারী উপজেলার প্রত্যন্ত চরাঞ্চলের সুবিধাবঞ্চিত মানুষের...' })
  @IsOptional()
  @IsString()
  aboutSummaryBn?: string;

  @ApiPropertyOptional({ example: 'Rowmari Janakalyan Foundation is a dedicated charitable organization...' })
  @IsOptional()
  @IsString()
  aboutSummaryEn?: string;

  @ApiPropertyOptional({ example: 'ভোলামোড়, রৌমারী উপজেলা, রংপুর, বাংলাদেশ-৫৬৪০' })
  @IsOptional()
  @IsString()
  addressBn?: string;

  @ApiPropertyOptional({ example: 'Volamor, Rowmari Upazila, Rangpur, Bangladesh, 5640' })
  @IsOptional()
  @IsString()
  addressEn?: string;

  @ApiPropertyOptional({ example: '+880 1712-345678' })
  @IsOptional()
  @IsString()
  hotline?: string;

  @ApiPropertyOptional({ example: '+880 1712-345678' })
  @IsOptional()
  @IsString()
  phonePrimary?: string;

  @ApiPropertyOptional({ example: '+880 1812-987654' })
  @IsOptional()
  @IsString()
  phoneSecondary?: string;

  @ApiPropertyOptional({ example: '+880 1712-345678' })
  @IsOptional()
  @IsString()
  emergencyHotline?: string;

  @ApiPropertyOptional({ example: 'contact@rowmarijanakalyan.org' })
  @IsOptional()
  @IsString()
  emailPrimary?: string;

  @ApiPropertyOptional({ example: 'support@rowmarijanakalyan.org' })
  @IsOptional()
  @IsString()
  emailSupport?: string;

  @ApiPropertyOptional({ example: 'সমাজসেবা ও স্বেচ্ছাসেবী ট্রাস্ট নিবন্ধন নম্বর: RJF-KUR-2018/042' })
  @IsOptional()
  @IsString()
  registrationNoBn?: string;

  @ApiPropertyOptional({ example: 'Govt. Affiliation & Registration: RJF-KUR-2018/042' })
  @IsOptional()
  @IsString()
  registrationNoEn?: string;

  @ApiPropertyOptional({ example: 'https://www.facebook.com/share/1ESs7zSjYo/' })
  @IsOptional()
  @IsString()
  facebookPageUrl?: string;

  @ApiPropertyOptional({ example: 'https://www.facebook.com/share/g/186KVkSwCg/' })
  @IsOptional()
  @IsString()
  facebookGroupUrl?: string;

  @ApiPropertyOptional({ example: 'https://youtube.com' })
  @IsOptional()
  @IsString()
  youtubeUrl?: string;

  @ApiPropertyOptional({ example: 'https://linkedin.com' })
  @IsOptional()
  @IsString()
  linkedinUrl?: string;

  @ApiPropertyOptional({ example: '© ২০২৪-২০২৬ রৌমারী জনকল্যাণ ফাউন্ডেশন (RJF)। সর্বস্বত্ব সংরক্ষিত।' })
  @IsOptional()
  @IsString()
  copyrightTextBn?: string;

  @ApiPropertyOptional({ example: '© 2024-2026 Rowmari Janakalyan Foundation (RJF). All rights reserved.' })
  @IsOptional()
  @IsString()
  copyrightTextEn?: string;

  @ApiPropertyOptional({ example: [] })
  @IsOptional()
  @IsArray()
  quickLinks?: any[];
}
