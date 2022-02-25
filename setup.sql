CREATE TYPE unit_pool AS ENUM ('WIKI', 'EXOTIC');
CREATE TABLE units (
	id SERIAL PRIMARY KEY,
	long_name VARCHAR(512),
	name VARCHAR(128),
	factor FLOAT,
	si_m SMALLINT DEFAULT 0,
	si_a SMALLINT DEFAULT 0,
	si_cd SMALLINT DEFAULT 0,
	si_s SMALLINT DEFAULT 0,
	si_mol SMALLINT DEFAULT 0,
	si_k SMALLINT DEFAULT 0,
	si_kg SMALLINT DEFAULT 0,
	pool unit_pool
);
CREATE INDEX ON units (si_m, si_a, si_cd, si_s, si_mol, si_k, si_kg);
CREATE INDEX ON units (factor);
CREATE INDEX ON units (name);
CREATE INDEX ON units (pool);

\copy units (long_name,name,factor,si_m,si_a,si_cd,si_s,si_mol,si_k,si_kg) FROM '/path/to/unit_combo.csv' DELIMITER E',' CSV HEADER;
UPDATE units SET pool = 'EXOTIC';
\copy units (long_name,name,factor,si_m,si_a,si_cd,si_s,si_mol,si_k,si_kg) FROM '/path/to/unit_wiki.csv' DELIMITER E',' CSV HEADER;
UPDATE units SET pool = 'WIKI' WHERE pool IS NULL;
\copy units (long_name,name,factor,si_m,si_a,si_cd,si_s,si_mol,si_k,si_kg) FROM '/path/to/unit_wiki.csv' DELIMITER E',' CSV HEADER;
UPDATE units SET pool = 'EXOTIC' WHERE pool IS NULL; -- lump wiki units into exotic as well

-- oddly the wiki database was missing ampere
INSERT INTO units (long_name, name, factor, si_m, si_a, si_cd, si_s, si_mol, si_k, si_kg, pool) VALUES ('Ampere', 'A', 1, 0,1,0,0,0,0,0, 'WIKI');
INSERT INTO units (long_name, name, factor, si_m, si_a, si_cd, si_s, si_mol, si_k, si_kg, pool) VALUES ('Ampere', 'A', 1, 0,1,0,0,0,0,0, 'EXOTIC');

INSERT INTO units (long_name, name, factor, si_m, si_a, si_cd, si_s, si_mol, si_k, si_kg, pool) VALUES ('Volt', 'V', 1, 2,-1,0,-1,0,0,1, 'WIKI');
INSERT INTO units (long_name, name, factor, si_m, si_a, si_cd, si_s, si_mol, si_k, si_kg, pool) VALUES ('Volt', 'V', 1, 2,-1,0,-1,0,0,1, 'EXOTIC');

INSERT INTO units (long_name, name, factor, si_m, si_a, si_cd, si_s, si_mol, si_k, si_kg, pool) VALUES ('centimeter', 'cm', 0.01, 1,0,0,0,0,0,0, 'WIKI');
INSERT INTO units (long_name, name, factor, si_m, si_a, si_cd, si_s, si_mol, si_k, si_kg, pool) VALUES ('centimeter', 'cm', 0.01, 1,0,0,0,0,0,0, 'EXOTIC');

INSERT INTO units (long_name, name, factor, si_m, si_a, si_cd, si_s, si_mol, si_k, si_kg, pool) VALUES ('1', '1', 1, 0,0,0,0,0,0,0, 'WIKI');
INSERT INTO units (long_name, name, factor, si_m, si_a, si_cd, si_s, si_mol, si_k, si_kg, pool) VALUES ('1', '1', 1, 0,0,0,0,0,0,0, 'EXOTIC');

ALTER TABLE units ADD si_event SMALLINT DEFAULT 0;
UPDATE units SET si_event = 1 WHERE name LIKE '%Bq%' OR name LIKE '%Rd%' OR name LIKE '%Ci%';
 UPDATE units SET si_event = -1 WHERE name LIKE '%1/(Bq)%' OR name LIKE '%1/(Rd)%' OR name LIKE '%1/(Ci)%';
 
 