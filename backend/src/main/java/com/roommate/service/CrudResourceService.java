package com.roommate.service;

import com.roommate.model.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class CrudResourceService {

    private static final int DEFAULT_PAGE_SIZE = 50;
    private static final int MAX_PAGE_SIZE = 200;
    private static final Set<String> SENSITIVE_FIELDS = Set.of("matKhau");

    private final Map<String, ResourceDef> resources = new LinkedHashMap<>();
    private final PasswordEncoder passwordEncoder;

    @PersistenceContext
    private EntityManager entityManager;

    public CrudResourceService(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
        register("nguoi-dung", NguoiDung.class, "maNguoiDung");
        register("xac-thuc-danh-tinh", XacThucDanhTinh.class, "maXacThuc")
                .relation("nguoiDung", "maNguoiDung", NguoiDung.class, "maNguoiDung");
        register("vi-tien", ViTien.class, "maVi")
                .relation("nguoiDung", "maNguoiDung", NguoiDung.class, "maNguoiDung");
        register("phong", Phong.class, "maPhong")
                .relation("chuPhong", "maChuPhong", NguoiDung.class, "maNguoiDung")
                .relation("phongCha", "maPhongCha", Phong.class, "maPhong");
        register("bai-dang", BaiDang.class, "maBaiDang")
                .relation("nguoiDang", "maNguoiDang", NguoiDung.class, "maNguoiDung")
                .relation("phong", "maPhong", Phong.class, "maPhong");
        register("yeu-cau-tham-gia", YeuCauThamGia.class, "maYeuCau")
                .relation("nguoiDung", "maNguoiDung", NguoiDung.class, "maNguoiDung")
                .relation("phong", "maPhong", Phong.class, "maPhong");
        register("chi-tiet-phong", ChiTietPhong.class, "phong", "nguoiDung")
                .relation("phong", "maPhong", Phong.class, "maPhong")
                .relation("nguoiDung", "maNguoiDung", NguoiDung.class, "maNguoiDung");
        register("dich-vu", DichVu.class, "maDichVu");
        register("hoa-don", HoaDon.class, "maHoaDon")
                .relation("nguoiDung", "maNguoiDung", NguoiDung.class, "maNguoiDung")
                .relation("phong", "maPhong", Phong.class, "maPhong");
        register("chi-tiet-hoa-don", ChiTietHoaDon.class, "maChiTietHoaDon")
                .relation("hoaDon", "maHoaDon", HoaDon.class, "maHoaDon")
                .relation("dichVu", "maDichVu", DichVu.class, "maDichVu");
        register("phieu-tam-tru", PhieuTamTru.class, "maPhieuTamTru")
                .relation("nguoiDung", "maNguoiDung", NguoiDung.class, "maNguoiDung")
                .relation("phong", "maPhong", Phong.class, "maPhong");
        register("danh-gia", DanhGia.class, "maDanhGia")
                .relation("nguoiDanhGia", "maNguoiDanhGia", NguoiDung.class, "maNguoiDung")
                .relation("hoaDon", "maHoaDon", HoaDon.class, "maHoaDon")
                .relation("nguoiDuocDanhGia", "maNguoiDuocDanhGia", NguoiDung.class, "maNguoiDung");
        register("tin-nhan", TinNhan.class, "maTinNhan")
                .relation("nguoiGui", "maNguoiGui", NguoiDung.class, "maNguoiDung")
                .relation("nguoiNhan", "maNguoiNhan", NguoiDung.class, "maNguoiDung");
    }

    public Set<String> listResourceNames() {
        return resources.keySet();
    }

    public Map<String, Object> findAll(String resource, int page, int size) {
        ResourceDef def = resource(resource);
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        Long total = entityManager.createQuery(
                        "select count(e) from " + def.entityClass.getSimpleName() + " e",
                        Long.class)
                .getSingleResult();
        List<Map<String, Object>> content = entityManager.createQuery(
                        "select e from " + def.entityClass.getSimpleName() + " e",
                        def.entityClass)
                .setFirstResult(safePage * safeSize)
                .setMaxResults(safeSize)
                .getResultList()
                .stream()
                .map(entity -> toMap(def, entity))
                .toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("content", content);
        result.put("page", safePage);
        result.put("size", safeSize);
        result.put("totalElements", total);
        result.put("totalPages", (int) Math.ceil(total / (double) safeSize));
        return result;
    }

    public Map<String, Object> findAll(String resource) {
        return findAll(resource, 0, DEFAULT_PAGE_SIZE);
    }

    public Map<String, Object> findById(String resource, Integer id) {
        ResourceDef def = resource(resource);
        ensureSingleId(def);
        return toMap(def, findEntity(def, id));
    }

    public Map<String, Object> findChiTietPhong(Integer maPhong, Integer maNguoiDung) {
        ResourceDef def = resource("chi-tiet-phong");
        return toMap(def, findEntity(def, new ChiTietPhong.ChiTietPhongId(maPhong, maNguoiDung)));
    }

    @Transactional
    public Map<String, Object> create(String resource, Map<String, Object> body) {
        ResourceDef def = resource(resource);
        Object entity = newInstance(def.entityClass);
        applyFields(def, entity, body, false);
        entityManager.persist(entity);
        entityManager.flush();
        return toMap(def, entity);
    }

    @Transactional
    public Map<String, Object> update(String resource, Integer id, Map<String, Object> body) {
        ResourceDef def = resource(resource);
        ensureSingleId(def);
        Object entity = findEntity(def, id);
        applyFields(def, entity, body, true);
        entityManager.flush();
        return toMap(def, entity);
    }

    @Transactional
    public Map<String, Object> updateChiTietPhong(Integer maPhong, Integer maNguoiDung, Map<String, Object> body) {
        ResourceDef def = resource("chi-tiet-phong");
        Object entity = findEntity(def, new ChiTietPhong.ChiTietPhongId(maPhong, maNguoiDung));
        applyFields(def, entity, body, true);
        entityManager.flush();
        return toMap(def, entity);
    }

    @Transactional
    public void delete(String resource, Integer id) {
        ResourceDef def = resource(resource);
        ensureSingleId(def);
        entityManager.remove(findEntity(def, id));
    }

    @Transactional
    public void deleteChiTietPhong(Integer maPhong, Integer maNguoiDung) {
        ResourceDef def = resource("chi-tiet-phong");
        entityManager.remove(findEntity(def, new ChiTietPhong.ChiTietPhongId(maPhong, maNguoiDung)));
    }

    private ResourceDef register(String name, Class<?> entityClass, String... idFields) {
        ResourceDef def = new ResourceDef(name, entityClass, List.of(idFields));
        resources.put(name, def);
        return def;
    }

    private ResourceDef resource(String name) {
        ResourceDef def = resources.get(name);
        if (def == null) {
            throw new RuntimeException("Khong ho tro resource: " + name);
        }
        return def;
    }

    private void ensureSingleId(ResourceDef def) {
        if (def.idFields.size() != 1) {
            throw new RuntimeException("Resource " + def.name + " dung khoa phuc hop. Hay dung /api/crud/chi-tiet-phong/{maPhong}/{maNguoiDung}");
        }
    }

    private Object findEntity(ResourceDef def, Object id) {
        Object entity = entityManager.find(def.entityClass, id);
        if (entity == null) {
            throw new RuntimeException("Khong tim thay " + def.name);
        }
        return entity;
    }

    private void applyFields(ResourceDef def, Object entity, Map<String, Object> body, boolean update) {
        for (Field field : allFields(def.entityClass)) {
            String fieldName = field.getName();
            if (def.idFields.contains(fieldName)
                    || SENSITIVE_FIELDS.contains(fieldName)
                    || Collection.class.isAssignableFrom(field.getType())) {
                continue;
            }

            RelationDef relation = def.relations.get(fieldName);
            if (relation != null) {
                if (body.containsKey(relation.requestKey)) {
                    setField(entity, field, reference(relation, body.get(relation.requestKey)));
                }
                continue;
            }

            if (!body.containsKey(fieldName)) {
                continue;
            }
            setField(entity, field, convert(body.get(fieldName), field.getType()));
        }

        applySensitiveFields(entity, body);

        if (!update && def.name.equals("chi-tiet-phong")) {
            RelationDef phong = def.relations.get("phong");
            RelationDef nguoiDung = def.relations.get("nguoiDung");
            setField(entity, field(def.entityClass, "phong"), reference(phong, body.get(phong.requestKey)));
            setField(entity, field(def.entityClass, "nguoiDung"), reference(nguoiDung, body.get(nguoiDung.requestKey)));
        }
    }

    private Object reference(RelationDef relation, Object rawId) {
        if (rawId == null) {
            return null;
        }
        return entityManager.getReference(relation.entityClass, convert(rawId, Integer.class));
    }

    private Map<String, Object> toMap(ResourceDef def, Object entity) {
        Map<String, Object> result = new LinkedHashMap<>();
        for (Field field : allFields(def.entityClass)) {
            if (SENSITIVE_FIELDS.contains(field.getName()) || Collection.class.isAssignableFrom(field.getType())) {
                continue;
            }

            Object value = getField(entity, field);
            RelationDef relation = def.relations.get(field.getName());
            if (relation != null) {
                result.put(relation.requestKey, value == null ? null : getField(value, field(relation.entityClass, relation.idField)));
            } else {
                result.put(field.getName(), value);
            }
        }
        return result;
    }

    private void applySensitiveFields(Object entity, Map<String, Object> body) {
        if (!(entity instanceof NguoiDung) || !body.containsKey("matKhau")) {
            return;
        }

        Object rawPassword = body.get("matKhau");
        if (rawPassword == null || String.valueOf(rawPassword).isBlank()) {
            return;
        }

        NguoiDung nguoiDung = (NguoiDung) entity;
        String password = String.valueOf(rawPassword);
        nguoiDung.setMatKhau(isBcrypt(password) ? password : passwordEncoder.encode(password));
    }

    private boolean isBcrypt(String password) {
        return password != null
                && (password.startsWith("$2a$")
                || password.startsWith("$2b$")
                || password.startsWith("$2y$"));
    }

    private Object convert(Object value, Class<?> targetType) {
        if (value == null) {
            return null;
        }
        if (targetType.isInstance(value)) {
            return value;
        }
        String text = String.valueOf(value);
        if (targetType == String.class) {
            return text;
        }
        if (targetType == Integer.class || targetType == int.class) {
            return Integer.valueOf(text);
        }
        if (targetType == Long.class || targetType == long.class) {
            return Long.valueOf(text);
        }
        if (targetType == Boolean.class || targetType == boolean.class) {
            return Boolean.valueOf(text);
        }
        if (targetType == BigDecimal.class) {
            return new BigDecimal(text);
        }
        if (targetType == LocalDate.class) {
            return LocalDate.parse(text);
        }
        if (targetType == LocalDateTime.class) {
            return LocalDateTime.parse(text);
        }
        if (targetType.isEnum()) {
            @SuppressWarnings({"unchecked", "rawtypes"})
            Object enumValue = Enum.valueOf((Class<Enum>) targetType, text);
            return enumValue;
        }
        throw new RuntimeException("Khong ho tro kieu du lieu: " + targetType.getSimpleName());
    }

    private Object newInstance(Class<?> type) {
        try {
            return type.getDeclaredConstructor().newInstance();
        } catch (Exception e) {
            throw new RuntimeException("Khong tao duoc entity: " + type.getSimpleName(), e);
        }
    }

    private List<Field> allFields(Class<?> type) {
        List<Field> fields = new ArrayList<>();
        Class<?> current = type;
        while (current != null && current != Object.class) {
            fields.addAll(List.of(current.getDeclaredFields()));
            current = current.getSuperclass();
        }
        return fields;
    }

    private Field field(Class<?> type, String name) {
        Class<?> current = type;
        while (current != null && current != Object.class) {
            try {
                return current.getDeclaredField(name);
            } catch (NoSuchFieldException ignored) {
                current = current.getSuperclass();
            }
        }
        throw new RuntimeException("Khong tim thay field " + name + " trong " + type.getSimpleName());
    }

    private Object getField(Object target, Field field) {
        try {
            field.setAccessible(true);
            return field.get(target);
        } catch (Exception e) {
            throw new RuntimeException("Khong doc duoc field: " + field.getName(), e);
        }
    }

    private void setField(Object target, Field field, Object value) {
        try {
            field.setAccessible(true);
            field.set(target, value);
        } catch (Exception e) {
            throw new RuntimeException("Khong gan duoc field: " + field.getName(), e);
        }
    }

    private static class ResourceDef {
        private final String name;
        private final Class<?> entityClass;
        private final List<String> idFields;
        private final Map<String, RelationDef> relations = new LinkedHashMap<>();

        private ResourceDef(String name, Class<?> entityClass, List<String> idFields) {
            this.name = name;
            this.entityClass = entityClass;
            this.idFields = idFields;
        }

        private ResourceDef relation(String fieldName, String requestKey, Class<?> entityClass, String idField) {
            relations.put(fieldName, new RelationDef(requestKey, entityClass, idField));
            return this;
        }
    }

    private record RelationDef(String requestKey, Class<?> entityClass, String idField) {
    }
}
