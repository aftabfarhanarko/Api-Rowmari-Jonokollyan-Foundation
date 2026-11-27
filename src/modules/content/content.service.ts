import { Injectable, NotFoundException, ConflictException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Page, NewsEvent, GalleryItem, Announcement } from './entities/content.entity';
import { WebsiteSetting } from './entities/website-setting.entity';
import { MediaFile } from './entities/media-file.entity';
import { NoticeModal } from './entities/notice-modal.entity';
import { HeroSlide } from './entities/hero-slide.entity';
import { FooterConfig } from './entities/footer-config.entity';
import {
  CreatePageDto,
  UpdatePageDto,
  CreateNewsEventDto,
  UpdateNewsEventDto,
  CreateGalleryItemDto,
  CreateAnnouncementDto,
  WebsiteSettingDto,
} from './dto/content.dto';
import {
  CreateNoticeModalDto,
  UpdateNoticeModalDto,
  CreateHeroSlideDto,
  UpdateHeroSlideDto,
  UpdateFooterConfigDto,
} from './dto/modal-hero-footer.dto';
import { PaginationQueryDto, createPaginationResult, PaginatedResult } from '../../common/dto/pagination.dto';
import { ContentStatus } from '../../common/constants';

@Injectable()
export class ContentService implements OnModuleInit {
  private readonly logger = new Logger(ContentService.name);

  constructor(
    @InjectRepository(Page)
    private readonly pageRepo: Repository<Page>,
    @InjectRepository(NewsEvent)
    private readonly newsRepo: Repository<NewsEvent>,
    @InjectRepository(GalleryItem)
    private readonly galleryRepo: Repository<GalleryItem>,
    @InjectRepository(Announcement)
    private readonly announcementRepo: Repository<Announcement>,
    @InjectRepository(WebsiteSetting)
    private readonly settingRepo: Repository<WebsiteSetting>,
    @InjectRepository(MediaFile)
    private readonly mediaRepo: Repository<MediaFile>,
    @InjectRepository(NoticeModal)
    private readonly noticeModalRepo: Repository<NoticeModal>,
    @InjectRepository(HeroSlide)
    private readonly heroSlideRepo: Repository<HeroSlide>,
    @InjectRepository(FooterConfig)
    private readonly footerConfigRepo: Repository<FooterConfig>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    try {
      // Ensure tables exist dynamically
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS "notice_modals" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "header_title" VARCHAR(200) NOT NULL DEFAULT 'জরুরি জনকল্যাণ নোটিশ ও ঘোষণা',
          "badge" VARCHAR(150) NOT NULL DEFAULT 'শীতবস্ত্র ও জরুরি মানবিক ত্রাণ ঘোষণা',
          "title" VARCHAR(255) NOT NULL,
          "description" TEXT NOT NULL,
          "hotline" VARCHAR(50) NOT NULL DEFAULT '+880 1712-345678',
          "address" VARCHAR(255) NOT NULL DEFAULT 'ভোলামোড়, রৌমারী উপজেলা, রংপুর, বাংলাদেশ (৫৬৪০)',
          "primary_btn_text" VARCHAR(100) NOT NULL DEFAULT 'অনুদান দিন',
          "primary_btn_link" VARCHAR(255) NOT NULL DEFAULT '/donate',
          "secondary_btn_text" VARCHAR(100) NOT NULL DEFAULT 'স্বেচ্ছাসেবক হন',
          "secondary_btn_link" VARCHAR(255) NOT NULL DEFAULT '/volunteer',
          "image_url" VARCHAR(500),
          "is_active" BOOLEAN NOT NULL DEFAULT true,
          "start_date" TIMESTAMPTZ,
          "end_date" TIMESTAMPTZ,
          "display_frequency" VARCHAR(50) NOT NULL DEFAULT 'ONCE_PER_DAY'
        );
      `);

      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS "hero_slides" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "title_bn" VARCHAR(255) NOT NULL,
          "title_en" VARCHAR(255),
          "subtitle_bn" TEXT NOT NULL,
          "subtitle_en" TEXT,
          "badge_bn" VARCHAR(150),
          "badge_en" VARCHAR(150),
          "category_bn" VARCHAR(100),
          "category_en" VARCHAR(100),
          "image_url" VARCHAR(500) NOT NULL,
          "btn_primary_bn" VARCHAR(100) NOT NULL DEFAULT 'অনুদান দিন',
          "btn_primary_en" VARCHAR(100) NOT NULL DEFAULT 'Donate Now',
          "btn_primary_link" VARCHAR(255) NOT NULL DEFAULT '/donate',
          "btn_secondary_bn" VARCHAR(100) NOT NULL DEFAULT 'কার্যক্রম দেখুন',
          "btn_secondary_en" VARCHAR(100) NOT NULL DEFAULT 'Explore Activities',
          "btn_secondary_link" VARCHAR(255) NOT NULL DEFAULT '/activities',
          "display_order" INT NOT NULL DEFAULT 0,
          "is_active" BOOLEAN NOT NULL DEFAULT true
        );
      `);

      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS "footer_configs" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "about_summary_bn" TEXT NOT NULL,
          "about_summary_en" TEXT,
          "address_bn" VARCHAR(255) NOT NULL,
          "address_en" VARCHAR(255),
          "hotline" VARCHAR(50) NOT NULL,
          "phone_primary" VARCHAR(50) NOT NULL,
          "phone_secondary" VARCHAR(50),
          "emergency_hotline" VARCHAR(50),
          "email_primary" VARCHAR(100) NOT NULL,
          "email_support" VARCHAR(100),
          "registration_no_bn" VARCHAR(200),
          "registration_no_en" VARCHAR(200),
          "facebook_page_url" VARCHAR(255),
          "facebook_group_url" VARCHAR(255),
          "youtube_url" VARCHAR(255),
          "linkedin_url" VARCHAR(255),
          "copyright_text_bn" VARCHAR(255) NOT NULL,
          "copyright_text_en" VARCHAR(255),
          "quick_links" JSONB
        );
      `);

      // Seed initial NoticeModal if table is empty
      const modalCount = await this.noticeModalRepo.count();
      if (modalCount === 0) {
        await this.noticeModalRepo.save({
          headerTitle: 'জরুরি জনকল্যাণ নোটিশ ও ঘোষণা',
          badge: 'শীতবস্ত্র ও জরুরি মানবিক ত্রাণ ঘোষণা',
          title: 'রৌমারী ও দুর্গম চরাঞ্চলের শীতার্ত পরিবারের পাশে দাঁড়ান',
          description: 'তীব্র শীতে রৌমারীর ব্রহ্মপুত্র নদের দুর্গম চরাঞ্চলের অসহায় পরিবারের মাঝে কম্বল ও শীতবস্ত্র বিতরণ কার্যক্রম পুরোদমে শুরু হয়েছে। আপনার সামান্য অনুদানে ফুটতে পারে একটি অসহায় পরিবারের মুখে হাসি।',
          hotline: '+880 1712-345678',
          address: 'ভোলামোড়, রৌমারী উপজেলা, রংপুর, বাংলাদেশ (৫৬৪০)',
          primaryBtnText: 'অনুদান দিন',
          primaryBtnLink: '/donate',
          secondaryBtnText: 'স্বেচ্ছাসেবক হন',
          secondaryBtnLink: '/volunteer',
          isActive: true,
          displayFrequency: 'ONCE_PER_DAY',
        });
        this.logger.log('Seeded initial NoticeModal record.');
      }

      // Seed initial HeroSlides if table is empty
      const heroCount = await this.heroSlideRepo.count();
      if (heroCount === 0) {
        await this.heroSlideRepo.save([
          {
            badgeBn: 'স্থাপিত ২০১৮ • রৌমারী, কুড়িগ্রাম • ৯ম বছরে পদার্পণ',
            badgeEn: 'Est. 2018 • Rowmari, Kurigram • 8+ Years of Service',
            categoryBn: 'মানবিক সহায়তা মিশন',
            categoryEn: 'Humanitarian Mission',
            titleBn: 'মানুষের পাশে, মানুষের জন্য',
            titleEn: 'Standing by People, For Humanity',
            subtitleBn: 'রৌমারী ও ব্রহ্মপুত্রের দুর্গম চরাঞ্চলের অসহায় শীতার্ত মানুষের পাশে দাঁড়ানোই আমাদের কাজ। শীতবস্ত্র, খাদ্য, শিক্ষা ও জরুরি চিকিৎসাসেবায় আমরা সার্বক্ষণিক নিবেদিত।',
            subtitleEn: 'Dedicated to serving the underprivileged in Rowmari and remote river island chars through winter relief, food aid, education, and healthcare support.',
            imageUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1800&q=85',
            btnPrimaryBn: 'অনুদান দিন',
            btnPrimaryEn: 'Donate Now',
            btnPrimaryLink: '/donate',
            btnSecondaryBn: 'কার্যক্রম দেখুন',
            btnSecondaryEn: 'Explore Activities',
            btnSecondaryLink: '/activities',
            displayOrder: 1,
            isActive: true,
          },
          {
            badgeBn: 'শীতবস্ত্র ও জরুরি খাদ্য সহায়তা তহবিল',
            badgeEn: 'Winter Warmth & Food Aid Relief',
            categoryBn: 'ত্রাণ ও পুনর্বাসন উইং',
            categoryEn: 'Relief & Rehabilitation Wing',
            titleBn: 'চরাঞ্চলের শীতার্ত মানুষের মুখে ফুটুক উষ্ণতার হাসি',
            titleEn: 'Spreading Warmth & Nutrition to Char Families',
            subtitleBn: 'তীব্র শীতে রৌমারীর ব্রহ্মপুত্র নদের প্রত্যন্ত চরাঞ্চলের অসহায় পরিবার, বৃদ্ধ ও শিশুদের মাঝে কম্বল, খাদ্যসামগ্রী ও জরুরি মানবিক সহায়তা প্রদান।',
            subtitleEn: 'Distributing warm blankets, food supplies, and urgent humanitarian relief to vulnerable families across river-island char unions.',
            imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1800&q=85',
            btnPrimaryBn: 'অনুদান দিন',
            btnPrimaryEn: 'Donate Now',
            btnPrimaryLink: '/donate',
            btnSecondaryBn: 'কার্যক্রম দেখুন',
            btnSecondaryEn: 'Explore Activities',
            btnSecondaryLink: '/activities',
            displayOrder: 2,
            isActive: true,
          },
          {
            badgeBn: 'দরিদ্র ও অসহায় রোগীর চিকিৎসা তহবিল',
            badgeEn: 'Medical Aid & Healthcare Fund',
            categoryBn: 'চিকিৎসা সহায়তা ও ফ্রি ওষুধ',
            categoryEn: 'Healthcare & Medicine Aid',
            titleBn: 'অসহায় রোগীর সুচিকিৎসায় আমাদের নিরলস অঙ্গীকার',
            titleEn: 'Quality Healthcare for Every Underprivileged Life',
            subtitleBn: 'বিনা চিকিৎসায় যেন কোনো প্রাণ না হারায়—অসহায় রোগীদের বড় ধরনের অপারেশন, জটিল হৃদরোগ, থ্যালাসেমিয়া ও ওষুধে জরুরি স্বাস্থ্যসেবা ও সহায়তা প্রদান।',
            subtitleEn: 'No life should be lost for lack of medicine. Providing vital medical grants, complex surgery support, and free physician camps in remote river island unions.',
            imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1800&q=85',
            btnPrimaryBn: 'চিকিৎসায় অনুদান দিন',
            btnPrimaryEn: 'Support Healthcare',
            btnPrimaryLink: '/donate',
            btnSecondaryBn: 'কার্যক্রম দেখুন',
            btnSecondaryEn: 'View Healthcare Work',
            btnSecondaryLink: '/activities',
            displayOrder: 3,
            isActive: true,
          },
          {
            badgeBn: 'শিক্ষা উপবৃত্তি ও মেধাবী সহায়তা প্রকল্প',
            badgeEn: 'Education Stipend & Char Schooling',
            categoryBn: 'শিক্ষা আলো ছড়াক চরে',
            categoryEn: 'Education For All',
            titleBn: 'সুবিধাবঞ্চিত শিশুদের শিক্ষার আলোয় গড়ে উঠুক আগামী',
            titleEn: 'Empowering Underprivileged Children Through Education',
            subtitleBn: 'অর্থের অভাবে যেন কোনো দরিদ্র মেধাবী শিশুর পড়াশোনা বন্ধ না হয়—রৌমারীর চরাঞ্চলে প্রাথমিক ও মাধ্যমিক শিক্ষার্থীদের স্কুল ব্যাগ, বইপত্র ও মাসিক বৃত্তি প্রদান।',
            subtitleEn: 'Poverty must not stop education. Distributing school supplies, notebooks, bags, and monthly scholarships to prevent student dropouts in remote chars.',
            imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1800&q=85',
            btnPrimaryBn: 'শিক্ষায় অনুদান দিন',
            btnPrimaryEn: 'Support Education',
            btnPrimaryLink: '/donate',
            btnSecondaryBn: 'কার্যক্রম দেখুন',
            btnSecondaryEn: 'View Education Work',
            btnSecondaryLink: '/activities',
            displayOrder: 4,
            isActive: true,
          },
        ]);
        this.logger.log('Seeded initial HeroSlides records.');
      }

      // Seed initial FooterConfig if table is empty
      const footerCount = await this.footerConfigRepo.count();
      if (footerCount === 0) {
        await this.footerConfigRepo.save({
          aboutSummaryBn: 'রৌমারী জনকল্যাণ ফাউন্ডেশন রৌমারী উপজেলার প্রত্যন্ত চরাঞ্চলের সুবিধাবঞ্চিত মানুষের পাশে দাঁড়িয়ে শীতবস্ত্র, খাদ্য, শিক্ষা ও স্বাস্থ্য সহায়তা প্রদানে অঙ্গীকারবদ্ধ একটি সেবামূলক প্রতিষ্ঠান।',
          aboutSummaryEn: 'Rowmari Janakalyan Foundation is a dedicated humanitarian NGO serving vulnerable communities in remote Brahmaputra river island chars.',
          addressBn: 'ভোলামোড়, রৌমারী উপজেলা, রংপুর, বাংলাদেশ-৫৬৪০',
          addressEn: 'Volamor, Rowmari Upazila, Rangpur, Bangladesh, 5640',
          hotline: '+880 1712-345678',
          phonePrimary: '+880 1712-345678',
          phoneSecondary: '+880 1812-987654',
          emergencyHotline: '+880 1712-345678',
          emailPrimary: 'contact@rowmarijanakalyan.org',
          emailSupport: 'support@rowmarijanakalyan.org',
          registrationNoBn: 'সমাজসেবা ও স্বেচ্ছাসেবী ট্রাস্ট নিবন্ধন নম্বর: RJF-KUR-2018/042',
          registrationNoEn: 'Govt. Affiliation & Registration: RJF-KUR-2018/042',
          facebookPageUrl: 'https://www.facebook.com/share/1ESs7zSjYo/',
          facebookGroupUrl: 'https://www.facebook.com/share/g/186KVkSwCg/',
          youtubeUrl: 'https://youtube.com',
          linkedinUrl: 'https://linkedin.com',
          copyrightTextBn: '© ২০১৮-২০২৬ রৌমারী জনকল্যাণ ফাউন্ডেশন (RJF)। সর্বস্বত্ব সংরক্ষিত।',
          copyrightTextEn: '© 2018-2026 Rowmari Janakalyan Foundation (RJF). All rights reserved.',
          quickLinks: [
            { href: '/', bn: 'হোম', en: 'Home' },
            { href: '/about', bn: 'আমাদের কথা', en: 'About Us' },
            { href: '/team', bn: 'টিম ও কমিটি', en: 'Our Team' },
            { href: '/activities', bn: 'কার্যক্রম', en: 'Activities' },
            { href: '/campaigns', bn: 'ক্যাম্পেইন', en: 'Campaigns' },
            { href: '/gallery', bn: 'গ্যালারি', en: 'Gallery' },
            { href: '/news', bn: 'সংবাদ ও বিজ্ঞপ্তি', en: 'News & Press' },
            { href: '/contact', bn: 'যোগাযোগ', en: 'Contact Us' },
          ],
        });
        this.logger.log('Seeded initial FooterConfig record.');
      }
    } catch (err: any) {
      this.logger.warn(`Could not complete table initialization or seeding: ${err.message}`);
    }
  }

  private slugify(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // --- Pages ---
  async createPage(dto: CreatePageDto): Promise<Page> {
    const slug = dto.slug ? this.slugify(dto.slug) : this.slugify(dto.title);
    const existing = await this.pageRepo.findOne({ where: { slug } });
    if (existing) {
      throw new ConflictException(`Page with slug '${slug}' already exists.`);
    }
    const page = this.pageRepo.create({
      title: dto.title,
      slug,
      subtitle: dto.subtitle || null,
      description: dto.description || null,
      content: dto.content,
      bannerImageUrl: dto.bannerImageUrl || null,
      sections: dto.sections || null,
      seoTitle: dto.seoTitle || null,
      seoDescription: dto.seoDescription || null,
      displayOrder: dto.displayOrder || 0,
      isSystemPage: dto.isSystemPage || false,
      status: dto.status || ContentStatus.PUBLISHED,
    });
    return this.pageRepo.save(page);
  }

  async updatePage(id: string, dto: UpdatePageDto): Promise<Page> {
    const page = await this.pageRepo.findOne({ where: { id } });
    if (!page) {
      throw new NotFoundException(`Page with ID '${id}' not found.`);
    }
    if (dto.slug && dto.slug !== page.slug) {
      const slug = this.slugify(dto.slug);
      const existing = await this.pageRepo.findOne({ where: { slug } });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Page with slug '${slug}' already exists.`);
      }
      page.slug = slug;
    }
    if (dto.title !== undefined) page.title = dto.title;
    if (dto.subtitle !== undefined) page.subtitle = dto.subtitle || null;
    if (dto.description !== undefined) page.description = dto.description || null;
    if (dto.content !== undefined) page.content = dto.content;
    if (dto.bannerImageUrl !== undefined) page.bannerImageUrl = dto.bannerImageUrl || null;
    if (dto.sections !== undefined) page.sections = dto.sections;
    if (dto.seoTitle !== undefined) page.seoTitle = dto.seoTitle || null;
    if (dto.seoDescription !== undefined) page.seoDescription = dto.seoDescription || null;
    if (dto.displayOrder !== undefined) page.displayOrder = dto.displayOrder;
    if (dto.isSystemPage !== undefined) page.isSystemPage = dto.isSystemPage;
    if (dto.status !== undefined) page.status = dto.status;

    return this.pageRepo.save(page);
  }

  async deletePage(id: string): Promise<{ success: boolean }> {
    const page = await this.pageRepo.findOne({ where: { id } });
    if (!page) {
      throw new NotFoundException(`Page with ID '${id}' not found.`);
    }
    await this.pageRepo.remove(page);
    return { success: true };
  }

  async getPageById(id: string): Promise<Page> {
    const page = await this.pageRepo.findOne({ where: { id } });
    if (!page) {
      throw new NotFoundException(`Page with ID '${id}' not found.`);
    }
    return page;
  }

  async getPageBySlug(slug: string): Promise<Page> {
    const page = await this.pageRepo.findOne({
      where: { slug, status: ContentStatus.PUBLISHED },
    });
    if (!page) {
      throw new NotFoundException(`Page '${slug}' not found.`);
    }
    return page;
  }

  async findAllPages(query: PaginationQueryDto, status?: ContentStatus): Promise<PaginatedResult<Page>> {
    const qb = this.pageRepo.createQueryBuilder('p')
      .orderBy('p.displayOrder', 'ASC')
      .addOrderBy('p.createdAt', 'DESC')
      .skip(query.skip)
      .take(query.limit);

    if (status) {
      qb.andWhere('p.status = :status', { status });
    }

    const [items, total] = await qb.getManyAndCount();
    return createPaginationResult(items, total, query.page, query.limit);
  }

  // --- News & Events ---
  async createNewsEvent(dto: CreateNewsEventDto): Promise<NewsEvent> {
    const baseSlug = dto.slug ? this.slugify(dto.slug) : this.slugify(dto.title);
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    const news = this.newsRepo.create({
      title: dto.title,
      slug,
      type: dto.type || 'NEWS',
      summary: dto.summary,
      content: dto.content,
      imageUrl: dto.imageUrl || null,
      eventDate: dto.eventDate ? new Date(dto.eventDate) : null,
      status: dto.status || ContentStatus.PUBLISHED,
    });
    return this.newsRepo.save(news);
  }

  async updateNewsEvent(id: string, dto: UpdateNewsEventDto): Promise<NewsEvent> {
    const item = await this.newsRepo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`News/Event with ID '${id}' not found.`);
    }
    if (dto.title !== undefined) item.title = dto.title;
    if (dto.type !== undefined) item.type = dto.type;
    if (dto.summary !== undefined) item.summary = dto.summary;
    if (dto.content !== undefined) item.content = dto.content;
    if (dto.imageUrl !== undefined) item.imageUrl = dto.imageUrl || null;
    if (dto.eventDate !== undefined) item.eventDate = dto.eventDate ? new Date(dto.eventDate) : null;
    if (dto.status !== undefined) item.status = dto.status;

    return this.newsRepo.save(item);
  }

  async deleteNewsEvent(id: string): Promise<{ success: boolean }> {
    const item = await this.newsRepo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`News/Event with ID '${id}' not found.`);
    }
    await this.newsRepo.remove(item);
    return { success: true };
  }

  async getNewsEventById(id: string): Promise<NewsEvent> {
    const item = await this.newsRepo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`News/Event with ID '${id}' not found.`);
    }
    return item;
  }

  async findAllNewsEvents(
    query: PaginationQueryDto,
    type?: string,
    status?: ContentStatus,
  ): Promise<PaginatedResult<NewsEvent>> {
    const qb = this.newsRepo.createQueryBuilder('n')
      .orderBy('n.createdAt', 'DESC')
      .skip(query.skip)
      .take(query.limit);

    if (status) {
      qb.andWhere('n.status = :status', { status });
    }
    if (type) {
      qb.andWhere('n.type = :type', { type });
    }

    const [items, total] = await qb.getManyAndCount();
    return createPaginationResult(items, total, query.page, query.limit);
  }

  async getNewsEventBySlug(slug: string): Promise<NewsEvent> {
    const item = await this.newsRepo.findOne({
      where: { slug, status: ContentStatus.PUBLISHED },
    });
    if (!item) {
      throw new NotFoundException(`News/Event item '${slug}' not found.`);
    }
    return item;
  }

  // --- Gallery ---
  async createGalleryItem(dto: CreateGalleryItemDto): Promise<GalleryItem> {
    const item = this.galleryRepo.create({
      title: dto.title,
      category: dto.category || 'General',
      mediaUrl: dto.mediaUrl || dto.imageUrl || '',
      mediaType: dto.mediaType || 'IMAGE',
      caption: dto.caption || null,
    });
    return this.galleryRepo.save(item);
  }

  async deleteGalleryItem(id: string): Promise<{ success: boolean }> {
    const item = await this.galleryRepo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Gallery item with ID '${id}' not found.`);
    }
    await this.galleryRepo.remove(item);
    return { success: true };
  }

  async findAllGallery(query: PaginationQueryDto, category?: string): Promise<PaginatedResult<GalleryItem>> {
    const qb = this.galleryRepo.createQueryBuilder('g')
      .orderBy('g.createdAt', 'DESC')
      .skip(query.skip)
      .take(query.limit);

    if (category) {
      qb.andWhere('g.category = :category', { category });
    }

    const [items, total] = await qb.getManyAndCount();
    return createPaginationResult(items, total, query.page, query.limit);
  }

  async getGalleryItemById(id: string): Promise<GalleryItem> {
    const item = await this.galleryRepo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Gallery item with ID '${id}' not found.`);
    }
    return item;
  }

  // --- Announcements ---
  async createAnnouncement(dto: CreateAnnouncementDto): Promise<Announcement> {
    const item = this.announcementRepo.create({
      title: dto.title,
      message: dto.message,
      severity: dto.severity || 'INFO',
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
    });
    return this.announcementRepo.save(item);
  }

  async deleteAnnouncement(id: string): Promise<{ success: boolean }> {
    const item = await this.announcementRepo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Announcement with ID '${id}' not found.`);
    }
    await this.announcementRepo.remove(item);
    return { success: true };
  }

  async getActiveAnnouncements(): Promise<Announcement[]> {
    return this.announcementRepo.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  // --- Website Settings ---
  async getSettings(group?: string): Promise<Record<string, any>> {
    const qb = this.settingRepo.createQueryBuilder('s');
    if (group) {
      qb.where('s.group = :group', { group });
    }
    const settings = await qb.getMany();
    const result: Record<string, any> = {};
    for (const s of settings) {
      try {
        result[s.key] = JSON.parse(s.value);
      } catch {
        result[s.key] = s.value;
      }
    }
    return result;
  }

  async getRawSettings(): Promise<WebsiteSetting[]> {
    return this.settingRepo.find({ order: { group: 'ASC', key: 'ASC' } });
  }

  async updateSettings(settings: WebsiteSettingDto[]): Promise<Record<string, any>> {
    for (const s of settings) {
      let existing = await this.settingRepo.findOne({ where: { key: s.key } });
      const valueStr = typeof s.value === 'object' ? JSON.stringify(s.value) : String(s.value);
      if (existing) {
        existing.value = valueStr;
        if (s.group) existing.group = s.group;
        if (s.description) existing.description = s.description;
        await this.settingRepo.save(existing);
      } else {
        const created = this.settingRepo.create({
          key: s.key,
          value: valueStr,
          group: s.group || 'general',
          description: s.description || null,
        });
        await this.settingRepo.save(created);
      }
    }
    return this.getSettings();
  }

  // --- Media Management ---
  async saveMedia(params: {
    originalName: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    url: string;
    category?: string;
    uploadedBy?: string;
  }): Promise<MediaFile> {
    const media = this.mediaRepo.create({
      originalName: params.originalName,
      fileName: params.fileName,
      mimeType: params.mimeType,
      sizeBytes: params.sizeBytes,
      url: params.url,
      category: params.category || 'general',
      uploadedBy: params.uploadedBy || null,
    });
    return this.mediaRepo.save(media);
  }

  async findAllMedia(query: PaginationQueryDto, category?: string): Promise<PaginatedResult<MediaFile>> {
    const qb = this.mediaRepo.createQueryBuilder('m')
      .orderBy('m.createdAt', 'DESC')
      .skip(query.skip)
      .take(query.limit);

    if (category) {
      qb.andWhere('m.category = :category', { category });
    }

    const [items, total] = await qb.getManyAndCount();
    return createPaginationResult(items, total, query.page, query.limit);
  }

  async deleteMedia(id: string): Promise<{ success: boolean }> {
    const media = await this.mediaRepo.findOne({ where: { id } });
    if (!media) {
      throw new NotFoundException(`Media file with ID '${id}' not found.`);
    }
    await this.mediaRepo.remove(media);
    return { success: true };
  }

  // ==========================================
  // --- 1. Notice / Popup Modal CRUD ---
  // ==========================================
  async getActiveNoticeModal(): Promise<NoticeModal | null> {
    const now = new Date();
    const qb = this.noticeModalRepo.createQueryBuilder('m')
      .where('m.isActive = :active', { active: true })
      .andWhere('(m.startDate IS NULL OR m.startDate <= :now)', { now })
      .andWhere('(m.endDate IS NULL OR m.endDate >= :now)', { now })
      .orderBy('m.createdAt', 'DESC');

    return qb.getOne();
  }

  async findAllNoticeModals(): Promise<NoticeModal[]> {
    return this.noticeModalRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async getNoticeModalById(id: string): Promise<NoticeModal> {
    const modal = await this.noticeModalRepo.findOne({ where: { id } });
    if (!modal) {
      throw new NotFoundException(`Notice modal with ID '${id}' not found.`);
    }
    return modal;
  }

  async createNoticeModal(dto: CreateNoticeModalDto): Promise<NoticeModal> {
    const modal = this.noticeModalRepo.create({
      headerTitle: dto.headerTitle || 'জরুরি জনকল্যাণ নোটিশ ও ঘোষণা',
      badge: dto.badge || 'শীতবস্ত্র ও জরুরি মানবিক ত্রাণ ঘোষণা',
      title: dto.title,
      description: dto.description,
      hotline: dto.hotline || '+880 1712-345678',
      address: dto.address || 'ভোলামোড়, রৌমারী উপজেলা, রংপুর, বাংলাদেশ (৫৬৪০)',
      primaryBtnText: dto.primaryBtnText || 'অনুদান দিন',
      primaryBtnLink: dto.primaryBtnLink || '/donate',
      secondaryBtnText: dto.secondaryBtnText || 'স্বেচ্ছাসেবক হন',
      secondaryBtnLink: dto.secondaryBtnLink || '/volunteer',
      imageUrl: dto.imageUrl || null,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      displayFrequency: dto.displayFrequency || 'ONCE_PER_DAY',
    });
    return this.noticeModalRepo.save(modal);
  }

  async updateNoticeModal(id: string, dto: UpdateNoticeModalDto): Promise<NoticeModal> {
    const modal = await this.getNoticeModalById(id);
    if (dto.headerTitle !== undefined) modal.headerTitle = dto.headerTitle;
    if (dto.badge !== undefined) modal.badge = dto.badge;
    if (dto.title !== undefined) modal.title = dto.title;
    if (dto.description !== undefined) modal.description = dto.description;
    if (dto.hotline !== undefined) modal.hotline = dto.hotline;
    if (dto.address !== undefined) modal.address = dto.address;
    if (dto.primaryBtnText !== undefined) modal.primaryBtnText = dto.primaryBtnText;
    if (dto.primaryBtnLink !== undefined) modal.primaryBtnLink = dto.primaryBtnLink;
    if (dto.secondaryBtnText !== undefined) modal.secondaryBtnText = dto.secondaryBtnText;
    if (dto.secondaryBtnLink !== undefined) modal.secondaryBtnLink = dto.secondaryBtnLink;
    if (dto.imageUrl !== undefined) modal.imageUrl = dto.imageUrl || null;
    if (dto.isActive !== undefined) modal.isActive = dto.isActive;
    if (dto.startDate !== undefined) modal.startDate = dto.startDate ? new Date(dto.startDate) : null;
    if (dto.endDate !== undefined) modal.endDate = dto.endDate ? new Date(dto.endDate) : null;
    if (dto.displayFrequency !== undefined) modal.displayFrequency = dto.displayFrequency;

    return this.noticeModalRepo.save(modal);
  }

  async toggleNoticeModalStatus(id: string): Promise<NoticeModal> {
    const modal = await this.getNoticeModalById(id);
    modal.isActive = !modal.isActive;
    return this.noticeModalRepo.save(modal);
  }

  async deleteNoticeModal(id: string): Promise<{ success: boolean }> {
    const modal = await this.getNoticeModalById(id);
    await this.noticeModalRepo.remove(modal);
    return { success: true };
  }

  // ==========================================
  // --- 2. Hero Slide CRUD ---
  // ==========================================
  async getActiveHeroSlides(): Promise<HeroSlide[]> {
    return this.heroSlideRepo.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async findAllHeroSlides(): Promise<HeroSlide[]> {
    return this.heroSlideRepo.find({
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async getHeroSlideById(id: string): Promise<HeroSlide> {
    const slide = await this.heroSlideRepo.findOne({ where: { id } });
    if (!slide) {
      throw new NotFoundException(`Hero slide with ID '${id}' not found.`);
    }
    return slide;
  }

  async createHeroSlide(dto: CreateHeroSlideDto): Promise<HeroSlide> {
    const slide = this.heroSlideRepo.create({
      titleBn: dto.titleBn,
      titleEn: dto.titleEn || null,
      subtitleBn: dto.subtitleBn,
      subtitleEn: dto.subtitleEn || null,
      badgeBn: dto.badgeBn || null,
      badgeEn: dto.badgeEn || null,
      categoryBn: dto.categoryBn || null,
      categoryEn: dto.categoryEn || null,
      imageUrl: dto.imageUrl,
      btnPrimaryBn: dto.btnPrimaryBn || 'অনুদান দিন',
      btnPrimaryEn: dto.btnPrimaryEn || 'Donate Now',
      btnPrimaryLink: dto.btnPrimaryLink || '/donate',
      btnSecondaryBn: dto.btnSecondaryBn || 'কার্যক্রম দেখুন',
      btnSecondaryEn: dto.btnSecondaryEn || 'Explore Activities',
      btnSecondaryLink: dto.btnSecondaryLink || '/activities',
      displayOrder: dto.displayOrder || 0,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    });
    return this.heroSlideRepo.save(slide);
  }

  async updateHeroSlide(id: string, dto: UpdateHeroSlideDto): Promise<HeroSlide> {
    const slide = await this.getHeroSlideById(id);
    if (dto.titleBn !== undefined) slide.titleBn = dto.titleBn;
    if (dto.titleEn !== undefined) slide.titleEn = dto.titleEn || null;
    if (dto.subtitleBn !== undefined) slide.subtitleBn = dto.subtitleBn;
    if (dto.subtitleEn !== undefined) slide.subtitleEn = dto.subtitleEn || null;
    if (dto.badgeBn !== undefined) slide.badgeBn = dto.badgeBn || null;
    if (dto.badgeEn !== undefined) slide.badgeEn = dto.badgeEn || null;
    if (dto.categoryBn !== undefined) slide.categoryBn = dto.categoryBn || null;
    if (dto.categoryEn !== undefined) slide.categoryEn = dto.categoryEn || null;
    if (dto.imageUrl !== undefined) slide.imageUrl = dto.imageUrl;
    if (dto.btnPrimaryBn !== undefined) slide.btnPrimaryBn = dto.btnPrimaryBn;
    if (dto.btnPrimaryEn !== undefined) slide.btnPrimaryEn = dto.btnPrimaryEn;
    if (dto.btnPrimaryLink !== undefined) slide.btnPrimaryLink = dto.btnPrimaryLink;
    if (dto.btnSecondaryBn !== undefined) slide.btnSecondaryBn = dto.btnSecondaryBn;
    if (dto.btnSecondaryEn !== undefined) slide.btnSecondaryEn = dto.btnSecondaryEn;
    if (dto.btnSecondaryLink !== undefined) slide.btnSecondaryLink = dto.btnSecondaryLink;
    if (dto.displayOrder !== undefined) slide.displayOrder = dto.displayOrder;
    if (dto.isActive !== undefined) slide.isActive = dto.isActive;

    return this.heroSlideRepo.save(slide);
  }

  async toggleHeroSlideStatus(id: string): Promise<HeroSlide> {
    const slide = await this.getHeroSlideById(id);
    slide.isActive = !slide.isActive;
    return this.heroSlideRepo.save(slide);
  }

  async deleteHeroSlide(id: string): Promise<{ success: boolean }> {
    const slide = await this.getHeroSlideById(id);
    await this.heroSlideRepo.remove(slide);
    return { success: true };
  }

  // ==========================================
  // --- 3. Footer Config CRUD ---
  // ==========================================
  async getFooterConfig(): Promise<FooterConfig> {
    let config = await this.footerConfigRepo.findOne({
      order: { createdAt: 'ASC' },
    });
    if (!config) {
      config = await this.footerConfigRepo.save({
        aboutSummaryBn: 'রৌমারী জনকল্যাণ ফাউন্ডেশন রৌমারী উপজেলার প্রত্যন্ত চরাঞ্চলের সুবিধাবঞ্চিত মানুষের পাশে দাঁড়িয়ে শীতবস্ত্র, খাদ্য, শিক্ষা ও স্বাস্থ্য সহায়তা প্রদানে অঙ্গীকারবদ্ধ একটি সেবামূলক প্রতিষ্ঠান।',
        aboutSummaryEn: 'Rowmari Janakalyan Foundation is a dedicated humanitarian NGO serving vulnerable communities in remote Brahmaputra river island chars.',
        addressBn: 'ভোলামোড়, রৌমারী উপজেলা, রংপুর, বাংলাদেশ-৫৬৪০',
        addressEn: 'Volamor, Rowmari Upazila, Rangpur, Bangladesh, 5640',
        hotline: '+880 1712-345678',
        phonePrimary: '+880 1712-345678',
        phoneSecondary: '+880 1812-987654',
        emergencyHotline: '+880 1712-345678',
        emailPrimary: 'contact@rowmarijanakalyan.org',
        emailSupport: 'support@rowmarijanakalyan.org',
        registrationNoBn: 'সমাজসেবা ও স্বেচ্ছাসেবী ট্রাস্ট নিবন্ধন নম্বর: RJF-KUR-2018/042',
        registrationNoEn: 'Govt. Affiliation & Registration: RJF-KUR-2018/042',
        facebookPageUrl: 'https://www.facebook.com/share/1ESs7zSjYo/',
        facebookGroupUrl: 'https://www.facebook.com/share/g/186KVkSwCg/',
        youtubeUrl: 'https://youtube.com',
        linkedinUrl: 'https://linkedin.com',
        copyrightTextBn: '© ২০১৮-২০২৬ রৌমারী জনকল্যাণ ফাউন্ডেশন (RJF)। সর্বস্বত্ব সংরক্ষিত।',
        copyrightTextEn: '© 2018-2026 Rowmari Janakalyan Foundation (RJF). All rights reserved.',
        quickLinks: [
          { href: '/', bn: 'হোম', en: 'Home' },
          { href: '/about', bn: 'আমাদের কথা', en: 'About Us' },
          { href: '/team', bn: 'টিম ও কমিটি', en: 'Our Team' },
          { href: '/activities', bn: 'কার্যক্রম', en: 'Activities' },
          { href: '/campaigns', bn: 'ক্যাম্পেইন', en: 'Campaigns' },
          { href: '/gallery', bn: 'গ্যালারি', en: 'Gallery' },
          { href: '/news', bn: 'সংবাদ ও বিজ্ঞপ্তি', en: 'News & Press' },
          { href: '/contact', bn: 'যোগাযোগ', en: 'Contact Us' },
        ],
      });
    }
    return config;
  }

  async updateFooterConfig(dto: UpdateFooterConfigDto): Promise<FooterConfig> {
    const config = await this.getFooterConfig();
    if (dto.aboutSummaryBn !== undefined) config.aboutSummaryBn = dto.aboutSummaryBn;
    if (dto.aboutSummaryEn !== undefined) config.aboutSummaryEn = dto.aboutSummaryEn || null;
    if (dto.addressBn !== undefined) config.addressBn = dto.addressBn;
    if (dto.addressEn !== undefined) config.addressEn = dto.addressEn || null;
    if (dto.hotline !== undefined) config.hotline = dto.hotline;
    if (dto.phonePrimary !== undefined) config.phonePrimary = dto.phonePrimary;
    if (dto.phoneSecondary !== undefined) config.phoneSecondary = dto.phoneSecondary || null;
    if (dto.emergencyHotline !== undefined) config.emergencyHotline = dto.emergencyHotline || null;
    if (dto.emailPrimary !== undefined) config.emailPrimary = dto.emailPrimary;
    if (dto.emailSupport !== undefined) config.emailSupport = dto.emailSupport || null;
    if (dto.registrationNoBn !== undefined) config.registrationNoBn = dto.registrationNoBn || null;
    if (dto.registrationNoEn !== undefined) config.registrationNoEn = dto.registrationNoEn || null;
    if (dto.facebookPageUrl !== undefined) config.facebookPageUrl = dto.facebookPageUrl || null;
    if (dto.facebookGroupUrl !== undefined) config.facebookGroupUrl = dto.facebookGroupUrl || null;
    if (dto.youtubeUrl !== undefined) config.youtubeUrl = dto.youtubeUrl || null;
    if (dto.linkedinUrl !== undefined) config.linkedinUrl = dto.linkedinUrl || null;
    if (dto.copyrightTextBn !== undefined) config.copyrightTextBn = dto.copyrightTextBn;
    if (dto.copyrightTextEn !== undefined) config.copyrightTextEn = dto.copyrightTextEn || null;
    if (dto.quickLinks !== undefined) config.quickLinks = dto.quickLinks;

    return this.footerConfigRepo.save(config);
  }
}
