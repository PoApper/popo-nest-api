import { CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiHideProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

// 날짜 관련 칼럼을 가지는 모든 엔티티의 기본 클래스
// @ApiHideProperty() 어노테이션을 붙이면 swagger에서 해당 칼럼을 보이지 않게 할 수 있음
// @Exclude() 어노테이션을 붙이면 컨트롤러에서 리턴 시 해당 칼럼을 보이지 않게 할 수 있음
export abstract class Base {
  @CreateDateColumn({ name: 'created_at' })
  @ApiHideProperty()
  @Exclude()
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  @ApiHideProperty()
  @Exclude()
  updatedAt: Date;
}
