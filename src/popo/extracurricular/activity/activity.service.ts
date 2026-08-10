import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from './activity.entity';
import { CreateActivityDto, UpdateActivityDto } from './activity.dto';

@Injectable()
export class ActivityService implements OnModuleInit {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
  ) {}

  async onModuleInit() {
    await this.seedInitialActivities();
  }

  private async seedInitialActivities() {
    const count = await this.activityRepository.count();
    if (count > 0) return;

    const initialActivities = [
      {
        title: '세계문화탐방대',
        period: '매년 하계/동계 방학 중 (연 2회)',
        target: '학부 재학생 (직전 학기 평점 3.0 이상)',
        applicationMethod: '지원서 및 탐방 계획서 작성 후 포털 접수 -> 서류 심사 -> 면접 전형',
        description: '학생들이 직접 탐방 주제와 국가를 선정하고 문화, 사회, 학문 분야의 연구 과제를 직접 체험하고 분석하는 글로벌 도전 프로그램입니다.',
        category: '글로벌/해외',
        iconName: 'Globe',
      },
      {
        title: '노벨 위크 탐방단',
        period: '매년 10월 ~ 11월 중 모집',
        target: '이공계열 및 인문사회계열 학부 2~4학년',
        applicationMethod: '노벨상 관련 에세이 제출 -> 심사 -> 학과장 추천 및 면접',
        description: '스웨덴 스톡홀름에서 열리는 노벨상 시상식 주간에 현지를 방문하여 노벨 재단 강연 참석, 스웨덴 명문대 학생들과의 학술 교류 등을 진행하는 최고 권위의 학술 탐방 프로그램입니다.',
        category: '학술/연구',
        iconName: 'Award',
      },
      {
        title: '해외 단기 어학연수',
        period: '매학기 초 모집 (3월, 9월)',
        target: '재학생 전체 (휴학생 제외, 공인어학성적 보유자 우대)',
        applicationMethod: '어학성적 및 학업계획서 평가 -> 모의 토익/토플 테스트 -> 최종 선발',
        description: '미국, 영국, 캐나다, 호주 등 자매결연 대학에서 4~8주간 집중 어학연수를 이수하고 학점 인정을 받는 대표적 글로벌 역량 강화 프로그램입니다.',
        category: '글로벌/해외',
        iconName: 'BookOpen',
      },
      {
        title: '전공심화 학술제',
        period: '매년 9월 모집',
        target: '전공/복수전공 이수 중인 3, 4학년 (팀 단위 구성)',
        applicationMethod: '학술 연구 계획서 제출 -> 중간 심사 -> 최종 피칭 및 전시',
        description: '자신의 전공 지식을 고도화하여 실무 문제를 해결하는 프로젝트를 수행하고 우수 연구 논문 및 프로젝트를 발표하여 학문적 우수성을 겨루는 교내 학술 축제입니다.',
        category: '학술/연구',
        iconName: 'FileText',
      },
      {
        title: '지역사회 혁신 서포터즈',
        period: '매년 4월 모집 (연 1회)',
        target: '학부생 누구나 (개인 혹은 5인 이하 팀)',
        applicationMethod: '지역 사회 문제 해결 아이디어 제안서 접수 -> 서류 및 대면 심사',
        description: '지역사회의 다양한 사회적, 환경적 현안을 발굴하고, 디자인 씽킹 방법론을 적용하여 실질적인 해결 방안을 제안·실행하는 공익 지향성 대외 공헌 프로그램입니다.',
        category: '봉사/사회공헌',
        iconName: 'Users',
      },
      {
        title: '실전 창업 캠프 & 해커톤',
        period: '매년 5월, 11월 (연 2회)',
        target: '창업에 관심 있는 재학생 및 예비 창업팀',
        applicationMethod: '아이디어 기획서 접수 -> 서류 통과 팀 대상 2박 3일 해커톤 진행',
        description: '아이디어 빌드업부터 BM 특허 분석, 전문가 멘토링, 시제품 제작 및 IR 피칭까지 3일간 밀도 높은 창업 트레이닝을 경험할 수 있는 혁신 인큐베이팅 캠프입니다.',
        category: '창업/취업',
        iconName: 'Lightbulb',
      },
    ];

    for (const act of initialActivities) {
      await this.activityRepository.save(this.activityRepository.create(act));
    }
  }

  async findAll(category?: string): Promise<Activity[]> {
    if (category && category !== '전체') {
      return this.activityRepository.find({ where: { category }, order: { createdAt: 'DESC' } });
    }
    return this.activityRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(uuid: string): Promise<Activity | null> {
    return this.activityRepository.findOne({ where: { uuid } });
  }

  async create(dto: CreateActivityDto): Promise<Activity> {
    const activity = this.activityRepository.create(dto);
    return this.activityRepository.save(activity);
  }

  async update(uuid: string, dto: UpdateActivityDto): Promise<Activity | null> {
    await this.activityRepository.update({ uuid }, dto);
    return this.findOne(uuid);
  }

  async remove(uuid: string): Promise<void> {
    await this.activityRepository.delete({ uuid });
  }
}
