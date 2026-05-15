package com.roommate.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "DichVu")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DichVu {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "maDichVu") private Integer maDichVu;

    @Column(name = "tenDichVu", length = 100) private String tenDichVu;
    @Column(name = "giaTien", precision = 18, scale = 2) private BigDecimal giaTien;
    @Column(name = "donViTinh", length = 50) private String donViTinh;
    @Column(name = "moTa", columnDefinition = "TEXT") private String moTa;
}
