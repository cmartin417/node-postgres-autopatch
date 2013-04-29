CREATE TABLE balloons
(
  id serial NOT NULL,
  color text,
  size integer,
  CONSTRAINT id PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE balloons
  OWNER TO postgres;
