
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Rating & Ulasan</title>

    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
        }

        body {
            background: #f7f7fb;
            min-height: 100vh;
        }

        .page {
            padding: 40px 80px;
        }

        .page h1 {
            font-size: 28px;
            margin-bottom: 25px;
            color: #222;
        }

        .session-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .session-info h3 {
            margin-bottom: 6px;
            color: #333;
        }

        .session-info p {
            color: #777;
            font-size: 14px;
        }

        .status {
            background: #dcfce7;
            color: #15803d;
            padding: 7px 14px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: bold;
        }

        .overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.45);
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 16px;
            z-index: 9999;
        }

        .review-modal {
            position: relative;
            z-index: 10000;
            width: 450px;
            max-width: 100%;
            background: white;
            border-radius: 18px;
            padding: 30px;
            text-align: center;
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
        }

        .avatar {
            width: 70px;
            height: 70px;
            border-radius: 50%;
            background: #ede9fe;
            color: #4f46e5;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            margin: 0 auto 18px;
        }

        .review-modal h2 {
            font-size: 22px;
            color: #222;
            margin-bottom: 8px;
        }

        .subtitle {
            color: #777;
            font-size: 14px;
            margin-bottom: 25px;
        }

        .stars {
            display: flex;
            justify-content: center;
            gap: 8px;
            margin-bottom: 20px;
        }

        .star {
            font-size: 38px;
            color: #d1d5db;
            cursor: pointer;
            transition: color 0.2s;
            user-select: none;
        }

        .star.active {
            color: #f59e0b;
        }

        .star:focus-visible {
            outline: 2px solid #4f46e5;
            outline-offset: 3px;
        }

        textarea {
            display: block;
            width: 100%;
            min-height: 100px;
            resize: vertical;
            border: 1px solid #ddd;
            border-radius: 10px;
            padding: 14px;
            font-size: 14px;
            outline: none;
        }

        textarea:focus {
            border-color: #4f46e5;
        }

        .buttons {
            display: flex;
            gap: 12px;
            margin-top: 20px;
        }

        .btn {
            flex: 1;
            padding: 12px;
            border-radius: 9px;
            border: none;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            min-height: 44px;
        }

        .btn.outline {
            background: white;
            border: 1px solid #4f46e5;
            color: #4f46e5;
        }

        .btn.primary {
            background: #4f46e5;
            color: white;
        }

        .btn.primary:hover {
            background: #4338ca;
        }

        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .message {
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 16px;
            text-align: left;
            font-size: 14px;
        }

        .message.success {
            background: #dcfce7;
            color: #166534;
        }

        .message.error {
            background: #fee2e2;
            color: #991b1b;
        }

        @media (max-width: 600px) {
            .page {
                padding: 24px 16px;
            }

            .review-modal {
                padding: 24px 20px;
            }

            .review-modal h2 {
                font-size: 20px;
            }

            .star {
                font-size: 34px;
            }
        }
    </style>
</head>

<body>

    <div class="page">
        <h1>Riwayat Bimbingan</h1>

        <div class="session-card">
            <div class="session-info">
                <h3>Kak Raka</h3>
                <p>Java · 3 Okt 2026</p>
            </div>
            <span class="status">Selesai</span>
        </div>

        <div class="session-card">
            <div class="session-info">
                <h3>Kak Sinta</h3>
                <p>HTML & CSS · 28 Sep 2026</p>
            </div>
            <span class="status">Selesai</span>
        </div>
    </div>

    <div class="overlay" id="review-overlay">
        <div class="review-modal">

            <div class="avatar">KR</div>

            <h2>Bagaimana sesimu dengan Kak Raka?</h2>
            <p class="subtitle">Java · 3 Okt 2026</p>

            @if (session('success'))
                <div class="message success" role="status">
                    {{ session('success') }}
                </div>
            @endif

            @if (session('error'))
                <div class="message error" role="alert">
                    {{ session('error') }}
                </div>
            @endif

            @if ($errors->any())
                <div class="message error" role="alert">
                    @foreach ($errors->all() as $error)
                        <div>{{ $error }}</div>
                    @endforeach
                </div>
            @endif

            <form
                id="review-form"
                action="{{ route('reviews.store', $session->id) }}"
                method="POST"
            >
                @csrf

                <div class="stars" aria-label="Pilih rating 1 sampai 5">
                    @for ($i = 1; $i <= 5; $i++)
                        <span
                            class="star {{ (int) old('rating', 0) >= $i ? 'active' : '' }}"
                            data-value="{{ $i }}"
                            role="button"
                            tabindex="0"
                            aria-label="{{ $i }} bintang"
                            aria-pressed="{{ (int) old('rating', 0) >= $i ? 'true' : 'false' }}"
                        >★</span>
                    @endfor
                </div>

                <input
                    type="hidden"
                    name="rating"
                    id="rating"
                    value="{{ old('rating', '') }}"
                >

                <textarea
                    name="feedback"
                    id="feedback"
                    maxlength="1000"
                    placeholder="Tulis ulasan singkat (opsional)..."
                >{{ old('feedback', '') }}</textarea>

                <div class="buttons">
                    <button
                        type="button"
                        id="skip-review"
                        class="btn outline"
                    >
                        Nanti
                    </button>

                    <button
                        type="submit"
                        id="submit-review"
                        class="btn primary"
                    >
                        Kirim Ulasan
                    </button>
                </div>
            </form>

        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function () {
            const form = document.getElementById('review-form');
            const ratingInput = document.getElementById('rating');
            const stars = document.querySelectorAll('.star');
            const skipButton = document.getElementById('skip-review');
            const submitButton = document.getElementById('submit-review');
            const overlay = document.getElementById('review-overlay');

            function setRating(value) {
                ratingInput.value = value;

                stars.forEach(function (star) {
                    const selected = Number(star.dataset.value) <= value;

                    star.classList.toggle('active', selected);
                    star.setAttribute(
                        'aria-pressed',
                        selected ? 'true' : 'false'
                    );
                });
            }

            stars.forEach(function (star) {
                star.addEventListener('click', function () {
                    setRating(Number(star.dataset.value));
                });

                star.addEventListener('keydown', function (event) {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setRating(Number(star.dataset.value));
                    }
                });
            });

            const initialRating = Number(ratingInput.value);

            if (initialRating >= 1 && initialRating <= 5) {
                setRating(initialRating);
            }

            skipButton.addEventListener('click', function () {
                overlay.style.display = 'none';
            });

            form.addEventListener('submit', function (event) {
                if (!ratingInput.value) {
                    event.preventDefault();
                    alert('Silakan pilih rating bintang terlebih dahulu.');
                    return;
                }

                if (!form.reportValidity()) {
                    event.preventDefault();
                    return;
                }

                submitButton.disabled = true;
                submitButton.textContent = 'Mengirim...';
            });
        });
    </script>

</body>
</html>