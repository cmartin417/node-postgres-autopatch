CREATE TABLE fun
(
  id serial NOT NULL,
  message text,
  CONSTRAINT fun_id PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE fun
  OWNER TO postgres;