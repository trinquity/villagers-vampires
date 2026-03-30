# Raspberry Pi 5 + Portainer dağıtımı

Bu proje Portainer üzerinde `build:` adımı çalıştırmaya güvenmeden deploy edilsin diye iki parçaya ayrıldı:

1. GitHub Actions çoklu mimari (`linux/amd64`, `linux/arm64`) image üretir ve GHCR'ye yollar.
2. Portainer stack'i yalnızca hazır image çeker.

Bu yaklaşım özellikle Raspberry Pi 5 için daha temizdir, çünkü resmi Portainer dokümanları Git repo üzerinden stack deploy ederken image build desteğinin sınırlı olduğunu, uzak ortamlarda en stabil yolun dışarıda build edilip registry image'ı kullanmak olduğunu belirtiyor.

## 1. Public GitHub repo oluştur

Bu klasörü public bir GitHub reposuna gönder. Repo adı örneği:

- `YOUR_GITHUB_USER/vampire_villagers`

Workflow dosyası [publish-ghcr-image.yml](/Users/trinquity/Development/GitHub/vampire_villagers/.github/workflows/publish-ghcr-image.yml) `main` branch'ine push olduğunda GHCR image yayınlar.

## 2. GHCR paketini public yap

İlk workflow çalıştıktan sonra GHCR paketi oluşur:

- `ghcr.io/YOUR_GITHUB_USER/vampire_villagers:latest`

GitHub arayüzünde package visibility'yi `Public` yap. Public repo olsa bile GHCR paketi bazen ilk push sonrası ayrıca public'e alınmalıdır.

## 3. Portainer stack deploy et

Portainer içinde:

1. `Stacks` bölümüne gir.
2. `Add stack` seç.
3. İstersen `Git repository`, istersen `Upload` kullan.
4. Compose dosyası olarak [stack.yml](/Users/trinquity/Development/GitHub/vampire_villagers/deploy/portainer/stack.yml) ver.

`Git repository` kullanacaksan önerilen alanlar:

- `Repository URL`: public GitHub repo URL'in
- `Repository reference`: `refs/heads/main`
- `Compose path`: `deploy/portainer/stack.yml`
- `GitOps updates`: açık
- `Re-pull image`: açık

Bu kombinasyon Portainer'ın repoyu takip etmesini ve update sırasında GHCR'den image'ı yeniden çekmesini sağlar.

Örnek environment değişkenleri:

- `IMAGE_NAME=ghcr.io/YOUR_GITHUB_USER/vampire_villagers`
- `IMAGE_TAG=latest`
- `APP_PORT=8080`

Bu durumda uygulama şu portta açılır:

- `http://RASPBERRY_PI_IP:8080`

## 4. Güncelleme akışı

Yeni kod gönderdiğinde:

1. GitHub Actions yeni image üretir.
2. Portainer'da GitOps update açıksa polling ya da webhook ile stack yeniden deploy edilir.
3. GitOps kullanmayacaksan stack ekranında `Pull and redeploy` yap.

İstersen `latest` yerine `sha-...` tag'leriyle kontrollü rollout da yapabilirsin.

## 5. Yerel Docker testi

Yerelde image build:

```bash
docker build -t vampire-villagers:local .
```

Yerelde container çalıştır:

```bash
docker run --rm -p 8080:80 vampire-villagers:local
```

Tarayıcı:

```text
http://localhost:8080
```

Sağlık kontrolü:

```text
http://localhost:8080/healthz
```
