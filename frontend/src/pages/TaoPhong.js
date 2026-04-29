import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { addressAPI, phongAPI } from '../services/api';

const createInitialForm = () => ({
  title: '',
  giaTien: '',
  tienDichVu: '',
  tienDien: '',
  tienNuoc: '',
  soNguoiToiDa: '',
  tinhThanh: '',
  quanHuyen: '',
  diaChi: '',
  moTa: '',
  maPhongCha: '',
});

export default function TaoPhong() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [form, setForm] = useState(createInitialForm);
  const [submitting, setSubmitting] = useState(false);
  const [loadingPhong, setLoadingPhong] = useState(isEditMode);
  const [loadingTinhThanh, setLoadingTinhThanh] = useState(true);
  const [loadingQuanHuyen, setLoadingQuanHuyen] = useState(false);
  const [tinhThanhs, setTinhThanhs] = useState([]);
  const [quanHuyens, setQuanHuyens] = useState([]);
  const [selectedTinhThanhCode, setSelectedTinhThanhCode] = useState('');
  const [selectedQuanHuyenCode, setSelectedQuanHuyenCode] = useState('');

  const set = (key, value) => setForm(current => ({ ...current, [key]: value }));

  useEffect(() => {
    let active = true;

    addressAPI.layTinhThanh()
      .then(response => {
        if (active) {
          setTinhThanhs(response.data || []);
        }
      })
      .catch(() => {
        if (active) {
          toast.error('Khong tai duoc danh sach tinh thanh');
        }
      })
      .finally(() => {
        if (active) {
          setLoadingTinhThanh(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isEditMode) {
      setLoadingPhong(false);
      setForm(createInitialForm());
      return;
    }

    let active = true;

    phongAPI.layPhongCuaToi()
      .then(response => {
        if (!active) {
          return;
        }

        const phong = (response.data.data || []).find(item => String(item.maPhong) === String(id));
        if (!phong) {
          toast.error('Ban khong co quyen chinh sua phong nay');
          navigate('/quan-ly-phong', { replace: true });
          return;
        }

        setForm({
          title: phong.title || '',
          giaTien: phong.giaTien || '',
          tienDichVu: phong.tienDichVu || '',
          tienDien: phong.tienDien || '',
          tienNuoc: phong.tienNuoc || '',
          soNguoiToiDa: phong.soNguoiToiDa || '',
          tinhThanh: phong.tinhThanh || '',
          quanHuyen: phong.quanHuyen || '',
          diaChi: phong.diaChi || '',
          moTa: phong.moTa || '',
          maPhongCha: phong.maPhongCha || '',
        });
      })
      .catch(() => {
        if (active) {
          toast.error('Khong tai duoc du lieu phong');
          navigate('/quan-ly-phong', { replace: true });
        }
      })
      .finally(() => {
        if (active) {
          setLoadingPhong(false);
        }
      });

    return () => {
      active = false;
    };
  }, [id, isEditMode, navigate]);

  useEffect(() => {
    if (!tinhThanhs.length || !form.tinhThanh) {
      return;
    }

    const matched = tinhThanhs.find(item => item.name === form.tinhThanh);
    if (matched && String(matched.code) !== String(selectedTinhThanhCode)) {
      setSelectedTinhThanhCode(String(matched.code));
    }
  }, [tinhThanhs, form.tinhThanh, selectedTinhThanhCode]);

  useEffect(() => {
    let active = true;

    if (!selectedTinhThanhCode) {
      setQuanHuyens([]);
      return undefined;
    }

    setLoadingQuanHuyen(true);

    addressAPI.layTinhThanhChiTiet(selectedTinhThanhCode)
      .then(response => {
        if (!active) {
          return;
        }

        const nextQuanHuyens = response.data?.districts || [];
        setQuanHuyens(nextQuanHuyens);

        if (form.quanHuyen) {
          const matchedDistrict = nextQuanHuyens.find(item => item.name === form.quanHuyen);
          setSelectedQuanHuyenCode(matchedDistrict ? String(matchedDistrict.code) : '');
        }
      })
      .catch(() => {
        if (active) {
          toast.error('Khong tai duoc danh sach quan huyen');
        }
      })
      .finally(() => {
        if (active) {
          setLoadingQuanHuyen(false);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedTinhThanhCode]);

  useEffect(() => {
    if (!quanHuyens.length || !form.quanHuyen) {
      return;
    }

    const matchedDistrict = quanHuyens.find(item => item.name === form.quanHuyen);
    if (matchedDistrict && String(matchedDistrict.code) !== String(selectedQuanHuyenCode)) {
      setSelectedQuanHuyenCode(String(matchedDistrict.code));
    }
  }, [quanHuyens, form.quanHuyen, selectedQuanHuyenCode]);

  const handleTinhThanhChange = event => {
    const nextCode = event.target.value;
    const selectedTinhThanh = tinhThanhs.find(item => String(item.code) === nextCode);

    setSelectedTinhThanhCode(nextCode);
    setSelectedQuanHuyenCode('');
    setQuanHuyens([]);
    setForm(current => ({
      ...current,
      tinhThanh: selectedTinhThanh?.name || '',
      quanHuyen: '',
    }));
  };

  const handleQuanHuyenChange = event => {
    const nextCode = event.target.value;
    const selectedQuanHuyen = quanHuyens.find(item => String(item.code) === nextCode);

    setSelectedQuanHuyenCode(nextCode);
    set('quanHuyen', selectedQuanHuyen?.name || '');
  };

  const parseMoney = value => (value === '' ? 0 : parseFloat(value));

  const handleSubmit = async event => {
    event.preventDefault();

    if (!form.tinhThanh || !form.quanHuyen) {
      toast.error('Vui long chon day du tinh thanh va quan huyen');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        title: form.title,
        giaTien: parseMoney(form.giaTien),
        tienDichVu: parseMoney(form.tienDichVu),
        tienDien: parseMoney(form.tienDien),
        tienNuoc: parseMoney(form.tienNuoc),
        soNguoiToiDa: parseInt(form.soNguoiToiDa, 10),
        tinhThanh: form.tinhThanh,
        quanHuyen: form.quanHuyen,
        diaChi: form.diaChi,
        moTa: form.moTa,
      };

      if (isEditMode) {
        await phongAPI.capNhat(id, payload);
        toast.success('Cap nhat phong thanh cong');
      } else {
        await phongAPI.taoPhong({
          ...payload,
          maPhongCha: form.maPhongCha ? parseInt(form.maPhongCha, 10) : undefined,
        });
        toast.success('Tao phong thanh cong');
      }

      navigate('/quan-ly-phong');
    } catch (error) {
      toast.error(error.response?.data?.message || (isEditMode ? 'Cap nhat phong that bai' : 'Tao phong that bai'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingPhong) {
    return <div className="spinner" />;
  }

  return (
    <div className="container page-wrapper">
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div className="card">
          <div className="card-header">{isEditMode ? 'Chinh sua phong' : 'Tao phong moi'}</div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Ten phong / Tieu de *</label>
                <input
                  className="form-control"
                  required
                  value={form.title}
                  onChange={event => set('title', event.target.value)}
                  placeholder="VD: Phong 101 - Chung cu ABC"
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Gia thue (d/thang) *</label>
                  <input
                    className="form-control"
                    type="number"
                    required
                    min="0"
                    value={form.giaTien}
                    onChange={event => set('giaTien', event.target.value)}
                    placeholder="3000000"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">So nguoi toi da *</label>
                  <input
                    className="form-control"
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={form.soNguoiToiDa}
                    onChange={event => set('soNguoiToiDa', event.target.value)}
                    placeholder="3"
                  />
                </div>
              </div>

              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label">Tien dich vu</label>
                  <input
                    className="form-control"
                    type="number"
                    min="0"
                    value={form.tienDichVu}
                    onChange={event => set('tienDichVu', event.target.value)}
                    placeholder="300000"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tien dien</label>
                  <input
                    className="form-control"
                    type="number"
                    min="0"
                    value={form.tienDien}
                    onChange={event => set('tienDien', event.target.value)}
                    placeholder="3500"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tien nuoc</label>
                  <input
                    className="form-control"
                    type="number"
                    min="0"
                    value={form.tienNuoc}
                    onChange={event => set('tienNuoc', event.target.value)}
                    placeholder="15000"
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Tinh / Thanh pho *</label>
                  <select
                    className="form-control"
                    required
                    value={selectedTinhThanhCode}
                    onChange={handleTinhThanhChange}
                    disabled={loadingTinhThanh}
                  >
                    <option value="">{loadingTinhThanh ? 'Dang tai tinh thanh...' : '-- Chon tinh thanh --'}</option>
                    {tinhThanhs.map(item => (
                      <option key={item.code} value={item.code}>{item.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Quan / Huyen *</label>
                  <select
                    className="form-control"
                    required
                    value={selectedQuanHuyenCode}
                    onChange={handleQuanHuyenChange}
                    disabled={!selectedTinhThanhCode || loadingQuanHuyen}
                  >
                    <option value="">
                      {!selectedTinhThanhCode
                        ? '-- Chon tinh thanh truoc --'
                        : loadingQuanHuyen
                          ? 'Dang tai quan huyen...'
                          : '-- Chon quan huyen --'}
                    </option>
                    {quanHuyens.map(item => (
                      <option key={item.code} value={item.code}>{item.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Dia chi chi tiet *</label>
                <input
                  className="form-control"
                  required
                  value={form.diaChi}
                  onChange={event => set('diaChi', event.target.value)}
                  placeholder="So nha, ten duong, toa nha..."
                />
              </div>

              {!isEditMode && (
                <div className="form-group">
                  <label className="form-label">Ma phong cha (neu la phong trong can ho)</label>
                  <input
                    className="form-control"
                    type="number"
                    value={form.maPhongCha}
                    onChange={event => set('maPhongCha', event.target.value)}
                    placeholder="ID can ho"
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Mo ta</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={form.moTa}
                  onChange={event => set('moTa', event.target.value)}
                  placeholder="Tien nghi, dieu kien, noi that..."
                />
              </div>

              <div className="alert alert-info">
                Du lieu tinh/thanh va quan/huyen duoc lay tu Vietnam Provinces API trong `openapi.json`.
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? 'Dang xu ly...' : isEditMode ? 'Luu thay doi' : 'Tao phong'}
                </button>
                <button type="button" className="btn btn-secondary btn-lg" onClick={() => navigate(-1)}>Huy</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
