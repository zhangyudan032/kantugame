-- 种子数据：初始题库
-- 请根据实际图片URL替换 image_url

INSERT INTO questions (image_url, answer) VALUES
  ('https://example.com/images/apple.jpg', '苹果'),
  ('https://example.com/images/banana.jpg', '香蕉'),
  ('https://example.com/images/cat.jpg', '猫'),
  ('https://example.com/images/dog.jpg', '狗'),
  ('https://example.com/images/elephant.jpg', '大象'),
  ('https://example.com/images/flower.jpg', '花'),
  ('https://example.com/images/guitar.jpg', '吉他'),
  ('https://example.com/images/house.jpg', '房子'),
  ('https://example.com/images/ice-cream.jpg', '冰淇淋'),
  ('https://example.com/images/jellyfish.jpg', '水母')
ON CONFLICT (answer) DO NOTHING;
