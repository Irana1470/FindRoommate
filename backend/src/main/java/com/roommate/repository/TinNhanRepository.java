package com.roommate.repository;

import com.roommate.model.TinNhan;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TinNhanRepository extends JpaRepository<TinNhan, Integer> {

    @Query("SELECT t FROM TinNhan t WHERE " +
           "(t.nguoiGui.maNguoiDung = :id1 AND t.nguoiNhan.maNguoiDung = :id2) OR " +
           "(t.nguoiGui.maNguoiDung = :id2 AND t.nguoiNhan.maNguoiDung = :id1) " +
           "ORDER BY t.thoiGian ASC")
    List<TinNhan> findConversation(@Param("id1") Integer id1, @Param("id2") Integer id2);

    @Query("SELECT t FROM TinNhan t WHERE " +
           "t.nguoiGui.maNguoiDung = :userId OR t.nguoiNhan.maNguoiDung = :userId " +
           "ORDER BY t.thoiGian DESC")
    List<TinNhan> findAllRelatedMessages(@Param("userId") Integer userId);

    @Query("SELECT t FROM TinNhan t WHERE " +
           "((t.nguoiGui.maNguoiDung = :id1 AND t.nguoiNhan.maNguoiDung = :id2) OR " +
           "(t.nguoiGui.maNguoiDung = :id2 AND t.nguoiNhan.maNguoiDung = :id1)) " +
           "AND (:before IS NULL OR t.thoiGian < :before) " +
           "ORDER BY t.thoiGian DESC")
    List<TinNhan> findConversationPage(
            @Param("id1") Integer id1,
            @Param("id2") Integer id2,
            @Param("before") LocalDateTime before,
            Pageable pageable
    );

    @Query("SELECT t FROM TinNhan t WHERE t.nguoiNhan.maNguoiDung = :userId " +
           "AND t.nguoiGui.maNguoiDung = :partnerId AND (t.thoiGianDaXem IS NULL)")
    List<TinNhan> findUnreadMessages(@Param("userId") Integer userId, @Param("partnerId") Integer partnerId);

    @Query("SELECT t FROM TinNhan t WHERE t.maTinNhan = :messageId AND " +
           "(t.nguoiGui.maNguoiDung = :userId OR t.nguoiNhan.maNguoiDung = :userId)")
    Optional<TinNhan> findAccessibleMessage(@Param("messageId") Integer messageId, @Param("userId") Integer userId);
}
