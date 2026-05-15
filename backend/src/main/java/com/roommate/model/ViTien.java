package com.roommate.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "ViTien")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ViTien {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "maVi") private Integer maVi;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maNguoiDung", nullable = false, unique = true)
    private NguoiDung nguoiDung;

    @Builder.Default
    @Column(name = "tongTien", precision = 18, scale = 2, nullable = false)
    private BigDecimal tongTien = BigDecimal.ZERO;
}
