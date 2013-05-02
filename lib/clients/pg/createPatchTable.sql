CREATE TABLE db_patch
(
  patch_number integer NOT NULL,
  patch_name text,
  patch_install_date_time timestamp with time zone NOT NULL,
  CONSTRAINT patch_number PRIMARY KEY (patch_number)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE db_patch
  OWNER TO postgres;