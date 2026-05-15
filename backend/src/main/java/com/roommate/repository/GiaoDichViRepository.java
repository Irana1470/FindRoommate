package com.roommate.repository;

import com.roommate.model.GiaoDichVi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GiaoDichViRepository extends JpaRepository<GiaoDichVi, Integer> {
    List<GiaoDichVi> findByViTien_NguoiDung_MaNguoiDungOrderByNgayTaoDesc(Integer maNguoiDung);
}
