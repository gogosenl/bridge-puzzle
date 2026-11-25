# Trail Builder

Expo SDK 57 ve React Native ile hazırlanmış, iOS/Expo Go uyumlu köprü bulmaca oyunu.

## Expo Go ile çalıştırma

1. Telefona Expo Go yükleyin ve giriş yapın.
2. Bilgisayar ile telefonun aynı Wi-Fi ağında olduğundan emin olun.
3. Proje klasöründe `npm install` çalıştırın.
4. `npx expo start --lan` çalıştırın.
5. iPhone kamerasıyla terminaldeki QR kodunu okutun.

Bağlantı sorunu yaşanırsa `npx expo start --tunnel` kullanılabilir.

## Oyun yapısı

- 10 katmana ayrılmış 500 doğrulanmış bölüm
- Her katmanda farklı giriş/çıkış düzenleri ve mekanik karışımları sunan 5 etap
- 4×4, 5×5, 6×6, 7×7 ve 8×8 bölüm grupları
- Kademeli artan köprü uzunluğu ve dönüş sayısı
- Başlangıçtan hedefe yol parçalarını kare kare elle yerleştirme
- Gidilen yöne göre otomatik oluşan düz ve köşe parçaları
- Birleşme uçları hücre kenarlarında tam merkezlenmiş gerçekçi köprü assetleri
- Yerleştirilmiş herhangi bir parçaya dokunarak yolu o noktadan geriye çekme
- Native sürücülü akıcı yerleştirme ve yön değiştirme animasyonları
- Hızlı art arda dokunmalarda güvenli hamle ve ipucu sayımı
- Her satır ve sütunda bulunması gereken parça sayısını gösteren ipuçları
- Tamamlanan sayıların yeşil, aşılan sayıların kırmızı gösterimi
- İpucu ve sıfırlama kontrolleri
- Özel logo, uygulama ikonu ve animasyonlu açılış ekranı
- Uygulama başlangıcında bir kez oynayan atmosferik logo ve ışık geçişi animasyonu
- Özgün sakin arka plan müziği ve beş farklı oyun ses efekti
- Çözüm anında başarı efekti ve animasyonlu yıldız sonuç ekranı
- Devam düğmesinden sonra efektli yeni bölüm geçişi
- Katman seçicili, asset destekli 500 bölümlük bölüm ekranı
- Kayalık kapalı kareler, zorunlu kontrol noktaları ve tek yönlü geçişler
- Yeni mekanikler için gerçekçi şeffaf assetler ve yalnızca ilk karşılaşmada gösterilen öğretici kartlar
- İlk tamamlamada kazanılan ipucu parası ve katman parası ekonomisi
- İpucu parasıyla kullanılan ipuçları ve artan maliyetle açılan yeni katmanlar
- Ana ekran, bölüm listesi ve oyun ekranında asset destekli bakiye göstergeleri
- Bölümler ve oyun ekranından tek dokunuşla ana sayfaya dönüş
- 1–3 yıldız puanlama ve bölüm kartlarında yıldız gösterimi
- SQLite tabanlı yerel ilerleme kaydı
- iPhone ve iPad desteği

## Kontroller

```bash
npm run validate-levels
npm run typecheck
npm run lint
npx expo-doctor
```

## Bölümleri yeniden üretme

```bash
npm run generate-levels
```

Üretici sabit tohumlar kullanır; aynı kaynak kod her seferinde aynı 500 bölümü oluşturur.
