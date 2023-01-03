CREATE TABLE question(
  uuid TEXT NOT NULL PRIMARY KEY,
  statement TEXT NOT NULL,
  selections TEXT NOT NULL,
  answer INTEGER NOT NULL,
  point INTEGER NOT NULL,
  figure TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE tag(
  idx INTEGER NOT NULL,
  uuid TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE UNIQUE INDEX tag_index ON tag(idx);

CREATE TABLE question_tag(
  question_uuid TEXT NOT NULL,
  tag_uuid TEXT NOT NULL
);
CREATE INDEX question_tag_index ON question_tag(question_uuid, tag_uuid);
