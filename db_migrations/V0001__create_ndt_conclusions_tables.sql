-- Создание таблицы справочника заказчиков
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    inn VARCHAR(12),
    address TEXT,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы справочника сварщиков
CREATE TABLE IF NOT EXISTS welders (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    certificate_number VARCHAR(100) NOT NULL,
    certificate_date DATE,
    qualification VARCHAR(255),
    organization VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы справочника диаметров труб
CREATE TABLE IF NOT EXISTS pipe_diameters (
    id SERIAL PRIMARY KEY,
    diameter VARCHAR(50) NOT NULL,
    wall_thickness VARCHAR(50),
    material VARCHAR(100),
    gost_standard VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы заключений
CREATE TABLE IF NOT EXISTS conclusions (
    id SERIAL PRIMARY KEY,
    number VARCHAR(100) NOT NULL UNIQUE,
    date DATE NOT NULL,
    object_name VARCHAR(500) NOT NULL,
    customer_id INTEGER REFERENCES customers(id),
    weld_number VARCHAR(100) NOT NULL,
    welder_id INTEGER REFERENCES welders(id),
    pipe_diameter_id INTEGER REFERENCES pipe_diameters(id),
    control_method VARCHAR(255) NOT NULL,
    equipment VARCHAR(255),
    normative_doc VARCHAR(255) DEFAULT 'СТО Газпром 15-1.3-004-2023',
    executor VARCHAR(255),
    certificate VARCHAR(100),
    temperature VARCHAR(50),
    defect_description TEXT,
    conclusion TEXT,
    result VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы шаблонов
CREATE TABLE IF NOT EXISTS templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    control_method VARCHAR(255) NOT NULL,
    equipment VARCHAR(255),
    normative_doc VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Вставка тестовых данных
INSERT INTO customers (name, inn, address, contact_person, phone, email) VALUES
('ПАО "Газпром"', '7736050003', 'г. Москва, ул. Наметкина, д. 16', 'Иванов Иван Иванович', '+7 (495) 719-30-01', 'info@gazprom.ru'),
('ООО "Транснефть"', '7706061801', 'г. Москва, ул. Большая Полянка, д. 57', 'Петров Петр Петрович', '+7 (495) 950-80-20', 'info@transneft.ru');

INSERT INTO welders (full_name, certificate_number, certificate_date, qualification, organization) VALUES
('Сидоров Алексей Викторович', 'НАКС-01-2023-001', '2023-05-15', 'III уровень, РД 03-495-02', 'ООО "СварМонтаж"'),
('Кузнецов Михаил Петрович', 'НАКС-01-2023-002', '2023-06-20', 'III уровень, РД 03-495-02', 'АО "ГазСтрой"'),
('Морозов Дмитрий Сергеевич', 'НАКС-01-2023-003', '2023-07-10', 'II уровень, РД 03-495-02', 'ООО "СварКомплект"');

INSERT INTO pipe_diameters (diameter, wall_thickness, material, gost_standard) VALUES
('Ø1420', '18.7 мм', 'Сталь 17Г1С', 'ГОСТ 20295-85'),
('Ø1220', '16.0 мм', 'Сталь 17Г1С', 'ГОСТ 20295-85'),
('Ø1020', '12.0 мм', 'Сталь 17ГС', 'ГОСТ 20295-85'),
('Ø820', '10.0 мм', 'Сталь 09Г2С', 'ГОСТ 20295-85'),
('Ø530', '8.0 мм', 'Сталь 20', 'ГОСТ 10704-91'),
('Ø325', '7.0 мм', 'Сталь 20', 'ГОСТ 10704-91');

INSERT INTO templates (name, control_method, equipment, normative_doc) VALUES
('УЗК магистральных трубопроводов', 'Ультразвуковой контроль', 'УД2-12', 'СТО Газпром 15-1.3-004-2023'),
('РК промысловых трубопроводов', 'Радиографический контроль', 'РАП-150/300', 'СТО Газпром 15-1.3-004-2023'),
('ВИК сварных соединений', 'Визуальный и измерительный контроль', 'Лупа 7х, УШС-3', 'СТО Газпром 15-1.3-004-2023');
