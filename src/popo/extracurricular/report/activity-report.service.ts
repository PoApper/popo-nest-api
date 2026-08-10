import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityReport } from './activity-report.entity';
import { CreateActivityReportDto, UpdateActivityReportDto } from './activity-report.dto';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class ActivityReportService implements OnModuleInit {
  constructor(
    @InjectRepository(ActivityReport)
    private readonly reportRepository: Repository<ActivityReport>,
    private readonly activityService: ActivityService,
  ) {}

  async onModuleInit() {
    await this.seedInitialReports();
  }

  private async seedInitialReports() {
    const count = await this.reportRepository.count();
    if (count > 0) return;

    const activities = await this.activityService.findAll();
    if (!activities || activities.length === 0) return;

    const worldActivity = activities.find(a => a.title.includes('세계문화탐방대')) || activities[0];
    const nobelActivity = activities.find(a => a.title.includes('노벨')) || activities[0];
    const abroadActivity = activities.find(a => a.title.includes('어학연수')) || activities[0];

    const initialReports = [
      {
        activityId: worldActivity.uuid,
        title: '유럽 친환경 도시 설계 및 탄소중립 교통 시스템 탐방 보고서',
        period: '2025학년도 하계',
        grade: '3학년',
        major: '도시공학과',
        author: '민*우',
        wordsToJuniors: '단순한 관광이 되지 않으려면 현지 전문가 인터뷰나 기관 방문 메일을 최소 한 달 전부터 꼼꼼히 보내두는 게 좋습니다. 거절 메일이 많이 오더라도 좌절하지 말고 꾸준히 연락해보세요! 정말 값진 경험이 됩니다.',
        aiSummary: '본 보고서는 독일 프라이부르크와 네덜란드 암스테르담의 친환경 대중교통 인프라 및 자전거 중심 도로 설계를 탐방한 결과를 담고 있습니다. 현지 지자체 담당자 인터뷰를 통해 교통 정책 수립 과정의 시민 참여 모델을 조사하고, 국내 수도권 신도시 모델에의 적용 방안을 제시하고 있습니다.',
        fileName: '2025_하계_세계문화탐방대_유럽교통보고서.pdf',
        fileType: 'pdf',
        pages: [
          '제 1 장: 탐방 개요 및 추진 배경\n최근 기후변화에 대응하는 글로벌 도시들의 탄소중립 실천 방안이 주목받고 있다. 본 탐방대는 유럽의 대표적 친환경 도시인 독일 프라이부르크와 네덜란드 암스테르담을 방문하여, 그들의 지속 가능한 교통 체계를 직접 체험하고 한국형 탄소중립 교통 모델의 시사점을 도출하고자 한다.',
          '제 2 장: 독일 프라이부르크의 보행자 중심 교통 모델\n보봉(Vauban) 지구는 자동차 없는 마을로 유명하다. 주차구역을 외곽으로 제한하고 단지 내부는 도보와 자전거, 트램 중심으로만 이동할 수 있게 설계하여 미세먼지와 소음을 혁신적으로 절감했다. 주민 커뮤니티와 자치회의 강력한 의지가 탄소중립 도시 구축의 핵심 원동력이 되었음을 파악했다.',
          '제 3 장: 네덜란드 암스테르담의 자전거 고속도로 체계\n암스테르담은 전 세계에서 자전거 인프라가 가장 정밀하게 구축된 도시 중 하나이다. 입체교차로와 전용 신호등, 자전거 터널 등 철저하게 자전거를 우선하는 도로 설계가 돋보인다. 이를 위해 대중교통과의 연계 시스템(간이 자전거 대여, 보관 인프라)이 유기적으로 연동되어 작동하고 있다.',
          '제 4 장: 시사점 및 국내 도시 설계에의 제언\n한국의 신도시(3기 신도시 등) 설계 시 차량 중심 도로 구조에서 탈피하여, 대중교통 거점을 중심으로 한 보행 안전 Zone 구축이 필요하다. 특히 자전거 전용 도로의 단절을 막는 네트워크 연계성 강화를 조례 수준에서 의무화하는 방안을 제안한다.',
        ],
      },
      {
        activityId: worldActivity.uuid,
        title: '일본의 고령사회 돌봄 로봇 산업 현황 및 실버 테크 탐방기',
        period: '2024학년도 동계',
        grade: '4학년',
        major: '기계공학과',
        author: '박*진',
        wordsToJuniors: '기계/전자 전공이더라도 사회과학이나 인문학적 배경지식을 넓혀 가시는 걸 추천해요. 단순 기술 연구보다 사용자의 편의성과 정서적 안정이 돌봄 시장의 핵심임을 배웠습니다.',
        aiSummary: '초고령사회를 겪고 있는 일본의 요양원 및 연구소를 방문하여 인공지능 기반 돌봄 로봇(식사 보조, 이송 보조, 반려형 로봇)의 도입 실태를 파악하고, 국내 고령화 친화 산업에의 적응 기술 방향성을 서술하였습니다.',
        fileName: '2024_동계_세계문화탐방_일본실버테크.hwpx',
        fileType: 'hwpx',
        pages: [
          '1. 서론: 탐방 목적 및 일정 요약\n대한민국의 고령화 속도는 전 세계적으로 유례없이 빠르다. 당사는 이미 초고령화 단계에 접어든 일본의 현장을 탐색하여 간호 인력난을 기술로 극복 중인 사례들을 수집 및 비교 분석하고자 탐방을 기획했다.',
          '2. 현장 방문기: 도쿄 종합 요양원 및 휴머노이드 센터\n도쿄 내 중형 요양원 A사를 방문하여 실제 작동 중인 이송 로봇과 커뮤니케이션 로봇(파로, 페퍼)의 이용률을 조사했다. 돌봄 로봇 도입 이후 간호 직원의 요통 발생률이 40% 감소했으며 요양 환자들의 정서적 불안 완화에 기여하고 있음을 확인했다.',
          '3. 기술적 한계 및 개선 요구 사항\n현재 상용화된 기기들은 센서의 정밀도 한계로 복잡한 침상 움직임 제어가 완벽하지 않다. 돌발 행동이 많은 중증 치매 환자의 경우 여전히 인간 간호사의 개입이 필수적이다. 향후 Multi-modal 센서 융합과 실시간 행동 예측 알고리즘이 탑재된 실버 테크의 고도화가 요구된다.',
        ],
      },
      {
        activityId: nobelActivity.uuid,
        title: '2025 Nobel Week 참가 보고서: 생리의학상 트렌드 분석과 노벨 포럼 강연 정리',
        period: '2025학년도 2학기',
        grade: '4학년',
        major: '생명과학과',
        author: '최*영',
        wordsToJuniors: '노벨 주간 행사는 사전 지식이 정말 중요해요. 그해 수상자들의 연구 논문을 꼭 미리 3~4편씩 읽고 가세요! 현장 질문 세션에서 마이크를 잡을 수 있는 큰 기회가 열립니다.',
        aiSummary: '2025년 스웨덴 스톡홀름 노벨 위크 현장을 참관하여 생리의학상 수상 분야의 주요 학술적 내용과 미래 유전자 치료 가이드라인을 연구한 결과 보고서입니다. 노벨 포럼에서 이뤄진 질의응답 및 현지 스탠포드/카롤린스카 연구원들과의 교류 세션을 요약 기술했습니다.',
        fileName: 'NobelWeek2025_MedicineReport.docx',
        fileType: 'docx',
        pages: [
          'I. 2025년 노벨 생리의학상 핵심 요약\n올해 수상 분야는 마이크로 RNA의 발견과 유전자 발현 조절 메커니즘 규명이다. 세포 내 단백질 합성을 정밀하게 억제하거나 조절함으로써 암, 유전 질환의 획기적인 치료제 개발 단초를 열었다는 점에서 학계의 찬사를 받았다.',
          'II. 노벨 포럼 & 콘서트홀 리셉션 참가\n카롤린스카 의과대학에서 개최된 학술 심포지엄에 참석하여 수상자들의 기조 강연을 직접 경청했다. 연구 동기와 수십 년간의 실패 극복 스토리를 직접 질문하고 듣는 소중한 기회를 가졌으며, 기초 학문의 중요성에 대해 다시금 성찰하는 계기가 되었다.',
          'III. 글로벌 학술 교류 및 향후 진로 연구 계획\n현지 대학원생과의 포스터 세션 교류를 통해 스웨덴의 연구 인프라와 진학 프로세스에 대한 정보를 얻었다. 귀국 후 학부 졸업 논문에 마이크로 RNA 제어 응용 분석을 추가하여 향후 석박사 통합 과정 유학 준비의 발판을 마련하기로 설계했다.',
        ],
      },
      {
        activityId: abroadActivity.uuid,
        title: '미국 캘리포니아 주립대 어학연수 및 현지 기업 직무 체험 수기',
        period: '2024학년도 2학기',
        grade: '2학년',
        major: '경영학과',
        author: '정*훈',
        wordsToJuniors: '어학교육원에만 있으면 영어 실력이 늘기 어려워요. 학교 내 다양한 동아리(Clubs)나 로컬 자원봉사 프로그램에 참여하여 현지인과 대화하는 시간을 억지로라도 만드세요.',
        aiSummary: 'UC Davis에서의 8주 단기 어학코스 이수 과정 및 실리콘밸리 한인 테크 스타트업 기업 탐방 세션을 통해 글로벌 비즈니스 매너와 커뮤니케이션 능력을 증진한 후기 보고서입니다.',
        fileName: 'UCDavis_Language_CareerReport.pdf',
        fileType: 'pdf',
        pages: [
          '1. 어학연수 프로그램 개요 및 학업 환경\n미국 UC Davis에서 개설한 Intensive English Program에 참여했다. 전 세계 15개국 이상에서 모인 학생들과 레벨 테스트를 통해 반이 나뉘고 영어 토론, 프리젠테이션, 작문 등 학업 목적 중심의 강도 높은 수업을 이수했다.',
          '2. 현지 실리콘밸리 기업 네트워킹 데이\n프로그램 연계 코스로 샌프란시스코 소재 글로벌 IT 기업 본사 투어 및 현업 엔지니어/마케터 선배들과의 멘토링 세션이 준비되어 있었다. 미국 시장의 유연한 조직 문화와 애자일 일하는 방식의 장단점을 논의하며 글로벌 리더십 역량을 배양했다.',
          '3. 종합 만족도 및 경비 정산 팁\n학교 장학금으로 학비의 70%가 지원되어 초기 부담을 덜었다. 숙소는 기숙사와 홈스테이 중 홈스테이를 선택했는데, 현지 가정의 문화를 밀접히 경험하고 일상 영어를 연습하는 데 매우 유리했다. 식사 및 마트 장보기 팁 등을 공유하여 후배들의 현지 적응 비용을 아낄 수 있도록 돕고자 한다.',
        ],
      },
    ];

    for (const rep of initialReports) {
      await this.reportRepository.save(this.reportRepository.create(rep));
    }
  }

  async findAll(query?: { activityId?: string; period?: string; major?: string }): Promise<ActivityReport[]> {
    const where: any = {};
    if (query?.activityId) where.activityId = query.activityId;
    if (query?.period && query.period !== '전체') where.period = query.period;
    if (query?.major && query.major !== '전체') where.major = query.major;

    return this.reportRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(uuid: string): Promise<ActivityReport | null> {
    return this.reportRepository.findOne({ where: { uuid } });
  }

  async create(dto: CreateActivityReportDto): Promise<ActivityReport> {
    const report = this.reportRepository.create(dto);
    return this.reportRepository.save(report);
  }

  async update(uuid: string, dto: UpdateActivityReportDto): Promise<ActivityReport | null> {
    await this.reportRepository.update({ uuid }, dto);
    return this.findOne(uuid);
  }

  async remove(uuid: string): Promise<void> {
    await this.reportRepository.delete({ uuid });
  }
}
