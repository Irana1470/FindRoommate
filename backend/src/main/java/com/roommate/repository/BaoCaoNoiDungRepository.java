package com.roommate.repository;

import com.roommate.model.BaoCaoNoiDung;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BaoCaoNoiDungRepository extends JpaRepository<BaoCaoNoiDung, Integer> {
    List<BaoCaoNoiDung> findAllByOrderByNgayTaoDesc();
}
