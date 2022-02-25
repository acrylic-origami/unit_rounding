--
-- PostgreSQL database dump
--

-- Dumped from database version 13.1
-- Dumped by pg_dump version 13.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: common_units; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.common_units (
    long_name character varying(255)
);


ALTER TABLE public.common_units OWNER TO postgres;

--
-- Data for Name: common_units; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.common_units (long_name) FROM stdin;
long_name
gill
solar mass
acre
square yard
hour
pound-force
long ton-force
day
yard
lunar distance
metric ton
mile
electronvolt
metre
cubic kilometer
second
US quart
carat
US pint
calorie
square mile
short ton
kilogram-force
inch-pound force
kilowatt-hour
month
megawatt-hour
gram
elementary charge
litre
hectare
watt
tesla
gauss
pascal
joule
cubic foot
degree Celsius
tonne of TNT
parsec
nautical mile
kilogram force-metre
tonne-force
square metre
watt-hour
minute
microinch
cubic yard
acre foot
long ton
gigawatt-hour
gray
gigaelectronvolt
megaelectronvolt
light-year
teraelectronvolt
kiloelectronvolt
kilometre per hour
mile per hour
micrometer
ounce
mole
square foot
newton metre
US gallon
cubic inch
foot
square inch
cubic mile
US fluid ounce
astronomical unit
smoot
week
degree Fahrenheit
kilocalorie
square kilometer
oersted
gigaparsec
torr
cubic metre
degree Rankine
kiloparsec
cubic centimetre
electrical horsepower
kelvin
league
fathom
curie
horsepower
newton
microgram
tonne
foot-pound force
British thermal unit
square centimeter
millimeter
kilometer
cubic centimeter
millilitre
milligram
kilogram
megagram
kilopascal
kilonewton
kilojoule
megajoule
candela
inch
\.


--
-- PostgreSQL database dump complete
--

