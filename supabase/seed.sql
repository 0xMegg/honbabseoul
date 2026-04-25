-- =============================================================================
-- honbabseoul — seed.sql
-- Generated: 2026-04-25
-- CURATED FAKE DATA — NOT FOR PRODUCTION
-- All names, addresses, Naver place IDs, and coordinates are fictional.
-- No real businesses are represented. Do NOT use these UUIDs or place IDs
-- against any live Naver Maps / Supabase instance without replacement.
--
-- Dependency: apply supabase/migrations/0001_restaurants.sql first.
-- Idempotency: explicit UUID ids + ON CONFLICT (id) DO NOTHING.
--   Re-running this file is safe; it will not duplicate rows and will not
--   disturb any pending (UGC) rows in the table.
-- =============================================================================

INSERT INTO restaurants (
    id,
    name_ja, name_ko,
    address_ja, address_ko,
    latitude, longitude,
    price_range,
    status,
    is_solo_default,
    has_jp_menu,
    is_late_night,
    naver_url,
    photo_url
) VALUES

-- ------------------------------------------------------------------ Hongdae --
-- 7 rows · 마포구 / 麻浦区 · lat [37.5500,37.5600] lng [126.9200,126.9280]
-- ------------------------------------------------------------------ Hongdae --
(
    'f47ac10b-58cc-4372-a567-0e02b2c3d401',
    'ホンデひとり食堂', '홍대혼밥식당',
    '韓国ソウル市麻浦区ワールドカップロ12-1', '서울시 마포구 월드컵로 12-1',
    37.5530, 126.9220, 'low', 'approved', true, true, false,
    'https://map.naver.com/p/entry/place/10000001', NULL
),
(
    'f47ac10b-58cc-4372-a567-0e02b2c3d402',
    '弘大スンドゥブ', '홍대순두부',
    '韓国ソウル市麻浦区楊花路8-3', '서울시 마포구 양화로 8-3',
    37.5545, 126.9235, 'low', 'approved', true, true, false,
    'https://map.naver.com/p/entry/place/10000002', NULL
),
(
    'f47ac10b-58cc-4372-a567-0e02b2c3d403',
    'ホンデ焼肉一人前', '홍대1인분구이',
    '韓国ソウル市麻浦区弘大入口路5-2', '서울시 마포구 홍대입구로 5-2',
    37.5515, 126.9245, 'mid', 'approved', true, true, true,
    'https://map.naver.com/p/entry/place/10000003', NULL
),
(
    'f47ac10b-58cc-4372-a567-0e02b2c3d404',
    '弘大無限リフィル', '홍대무한리필고기', -- group-only (무한리필 고기집)
    '韓国ソウル市麻浦区ワールドカップ北路20', '서울시 마포구 월드컵북로 20',
    37.5560, 126.9210, 'low', 'approved', false, false, true,
    'https://map.naver.com/p/entry/place/10000004', NULL
),
(
    'f47ac10b-58cc-4372-a567-0e02b2c3d405',
    'ホンデ海鮮チゲ', '홍대해물짜글이',
    '韓国ソウル市麻浦区東橋路15-7', '서울시 마포구 동교로 15-7',
    37.5575, 126.9255, 'mid', 'approved', true, false, false,
    'https://map.naver.com/p/entry/place/10000005', NULL
),
(
    'f47ac10b-58cc-4372-a567-0e02b2c3d406',
    '弘大ひとりラーメン', '홍대혼밥라면',
    '韓国ソウル市麻浦区楊花大路4-9', '서울시 마포구 양화대로 4-9',
    37.5590, 126.9265, 'low', 'approved', true, true, true,
    'https://map.naver.com/p/entry/place/10000006', NULL
),
(
    'f47ac10b-58cc-4372-a567-0e02b2c3d407',
    'ホンデひとりビビンバ', '홍대혼밥비빔밥',
    '韓国ソウル市麻浦区弘益路11-2', '서울시 마포구 홍익로 11-2',
    37.5505, 126.9270, 'mid', 'approved', true, true, false,
    'https://map.naver.com/p/entry/place/10000007', NULL
),

-- --------------------------------------------------------------- Myeongdong --
-- 7 rows · 중구 / 中区 · lat [37.5600,37.5660] lng [126.9800,126.9880]
-- --------------------------------------------------------------- Myeongdong --
(
    'c56a4180-65aa-42ec-a945-5fd21dec0538',
    '明洞ぼっちラーメン', '명동혼밥라멘',
    '韓国ソウル市中区明洞路6-1', '서울시 중구 명동길 6-1',
    37.5615, 126.9820, 'mid', 'approved', true, true, false,
    'https://map.naver.com/p/entry/place/10000008', NULL
),
(
    'c56a4180-65aa-42ec-a945-5fd21dec0539',
    '明洞サムゲタン', '명동삼계탕',
    '韓国ソウル市中区乙支路3-5', '서울시 중구 을지로 3-5',
    37.5630, 126.9840, 'mid', 'approved', true, true, false,
    'https://map.naver.com/p/entry/place/10000009', NULL
),
(
    'c56a4180-65aa-42ec-a945-5fd21dec053a',
    '明洞キンパ専門店', '명동김밥전문점',
    '韓国ソウル市中区明洞大路9-4', '서울시 중구 명동대로 9-4',
    37.5610, 126.9810, 'low', 'approved', true, true, false,
    'https://map.naver.com/p/entry/place/10000010', NULL
),
(
    'c56a4180-65aa-42ec-a945-5fd21dec053b',
    '明洞全骨スープ', '명동전골전문점', -- group-only (전골 전문)
    '韓国ソウル市中区乙支路2-8', '서울시 중구 을지로 2-8',
    37.5645, 126.9855, 'mid', 'approved', false, false, false,
    'https://map.naver.com/p/entry/place/10000011', NULL
),
(
    'c56a4180-65aa-42ec-a945-5fd21dec053c',
    '明洞シャブシャブコース', '명동샤브샤브코스', -- group-only (샤브샤브 코스)
    '韓国ソウル市中区明洞路14-3', '서울시 중구 명동길 14-3',
    37.5625, 126.9830, 'high', 'approved', false, true, false,
    'https://map.naver.com/p/entry/place/10000012', NULL
),
(
    'c56a4180-65aa-42ec-a945-5fd21dec053d',
    '明洞ひとりカルビ', '명동혼밥갈비',
    '韓国ソウル市中区南大門路7-1', '서울시 중구 남대문로 7-1',
    37.5655, 126.9870, 'high', 'approved', true, true, true,
    'https://map.naver.com/p/entry/place/10000013', NULL
),
(
    'c56a4180-65aa-42ec-a945-5fd21dec053e',
    '明洞スンドゥブチゲ', '명동순두부찌개',
    '韓国ソウル市中区明洞入口路2-6', '서울시 중구 명동입구로 2-6',
    37.5602, 126.9802, 'low', 'approved', true, true, false,
    'https://map.naver.com/p/entry/place/10000014', NULL
),

-- ----------------------------------------------------------------- Gangnam --
-- 6 rows · 강남구 / 江南区 · lat [37.4950,37.5180] lng [127.0250,127.0350]
-- ----------------------------------------------------------------- Gangnam --
(
    '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    '江南ソロ焼肉', '강남솔로구이',
    '韓国ソウル市江南区江南大路51-3', '서울시 강남구 강남대로 51-3',
    37.4990, 127.0280, 'mid', 'approved', true, true, false,
    'https://map.naver.com/p/entry/place/10000015', NULL
),
(
    '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6e',
    '江南곱창전골', '강남곱창전골', -- group-only (곱창전골)
    '韓国ソウル市江南区論峴路8-7', '서울시 강남구 논현로 8-7',
    37.5020, 127.0300, 'high', 'approved', false, false, true,
    'https://map.naver.com/p/entry/place/10000016', NULL
),
(
    '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6f',
    '江南プレミアム順豆腐', '강남프리미엄순두부',
    '韓国ソウル市江南区清潭洞路22-1', '서울시 강남구 청담동로 22-1',
    37.5055, 127.0325, 'high', 'approved', true, true, false,
    'https://map.naver.com/p/entry/place/10000017', NULL
),
(
    '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb70',
    '江南ひとりビビンバ', '강남혼밥비빔밥',
    '韓国ソウル市江南区テヘラン路34-9', '서울시 강남구 테헤란로 34-9',
    37.4965, 127.0255, 'low', 'approved', true, true, true,
    'https://map.naver.com/p/entry/place/10000018', NULL
),
(
    '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb71',
    '江南冷麺一人前', '강남혼밥냉면',
    '韓国ソウル市江南区江南大路西路13-5', '서울시 강남구 강남대로서로 13-5',
    37.5100, 127.0340, 'mid', 'approved', true, true, false,
    'https://map.naver.com/p/entry/place/10000019', NULL
),
(
    '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb72',
    '江南石焼ランチ', '강남돌솥런치',
    '韓国ソウル市江南区道山大路9-2', '서울시 강남구 도산대로 9-2',
    37.5160, 127.0270, 'high', 'approved', true, true, false,
    'https://map.naver.com/p/entry/place/10000020', NULL
)

ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- Verification queries (copy-paste ready after applying Slice 1 migration):
--
-- select count(*) from restaurants where status='approved';
--   → 20
--
-- select count(*) from restaurants where status='approved' and is_solo_default=false;
--   → 4 (rows: 10000004,10000011,10000012,10000016)
--
-- select price_range, count(*) from restaurants where status='approved'
--   group by price_range order by price_range;
--   → high:5  low:7  mid:8
--
-- select count(*) from restaurants where status='approved' and has_jp_menu=true;
--   → 16
-- select count(*) from restaurants where status='approved' and is_late_night=true;
--   → 6
--
-- Rollback (targeted cleanup — use the 20 explicit UUIDs below):
-- delete from restaurants where id in (
--   'f47ac10b-58cc-4372-a567-0e02b2c3d401',
--   'f47ac10b-58cc-4372-a567-0e02b2c3d402',
--   'f47ac10b-58cc-4372-a567-0e02b2c3d403',
--   'f47ac10b-58cc-4372-a567-0e02b2c3d404',
--   'f47ac10b-58cc-4372-a567-0e02b2c3d405',
--   'f47ac10b-58cc-4372-a567-0e02b2c3d406',
--   'f47ac10b-58cc-4372-a567-0e02b2c3d407',
--   'c56a4180-65aa-42ec-a945-5fd21dec0538',
--   'c56a4180-65aa-42ec-a945-5fd21dec0539',
--   'c56a4180-65aa-42ec-a945-5fd21dec053a',
--   'c56a4180-65aa-42ec-a945-5fd21dec053b',
--   'c56a4180-65aa-42ec-a945-5fd21dec053c',
--   'c56a4180-65aa-42ec-a945-5fd21dec053d',
--   'c56a4180-65aa-42ec-a945-5fd21dec053e',
--   '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
--   '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6e',
--   '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6f',
--   '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb70',
--   '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb71',
--   '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb72'
-- );
-- =============================================================================
