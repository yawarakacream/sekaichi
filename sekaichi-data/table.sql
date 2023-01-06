CREATE TABLE question(
  uuid TEXT NOT NULL,
  statement TEXT NOT NULL,
  selections TEXT NOT NULL,
  answer INTEGER NOT NULL,
  point INTEGER NOT NULL,
  figure TEXT,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (uuid)
);

CREATE TABLE tag(
  idx INTEGER NOT NULL,
  uuid TEXT NOT NULL,
  name TEXT NOT NULL,
  PRIMARY KEY (uuid)
);
CREATE UNIQUE INDEX tag_index ON tag(idx);

CREATE TABLE question_tag(
  question_uuid TEXT NOT NULL,
  tag_uuid TEXT NOT NULL,
  FOREIGN KEY (question_uuid) REFERENCES question(uuid) ON DELETE RESTRICT,
  FOREIGN KEY (tag_uuid) REFERENCES tag(uuid) ON DELETE RESTRICT
);
CREATE INDEX question_tag_index ON question_tag(question_uuid, tag_uuid);
