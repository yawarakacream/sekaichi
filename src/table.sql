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
  FOREIGN KEY (question_uuid) REFERENCES question(uuid) ON DELETE CASCADE,
  FOREIGN KEY (tag_uuid) REFERENCES tag(uuid) ON DELETE RESTRICT
);
CREATE INDEX question_tag_index ON question_tag(question_uuid, tag_uuid);

CREATE TABLE examination(
  uuid TEXT NOT NULL,
  name TEXT NOT NULL,
  answered_at INTEGER,
  PRIMARY KEY (uuid)
);

CREATE TABLE examination_excludedtags(
  examination_uuid TEXT NOT NULL,
  tag_uuid TEXT NOT NULL,
  FOREIGN KEY (examination_uuid) REFERENCES examination(uuid) ON DELETE CASCADE,
  FOREIGN KEY (tag_uuid) REFERENCES tag(uuid) ON DELETE CASCADE
);
CREATE INDEX examination_excludedtags_index ON examination_excludedtags(examination_uuid, tag_uuid);

CREATE TABLE exampart(
  uuid TEXT NOT NULL,
  examination_uuid TEXT NOT NULL,
  PRIMARY KEY (uuid),
  FOREIGN KEY (examination_uuid) REFERENCES examination(uuid) ON DELETE CASCADE
);
CREATE INDEX exampart_examination_uuid ON exampart(examination_uuid);

CREATE TABLE exampart_tag(
  exampart_uuid TEXT NOT NULL,
  tag_uuid TEXT NOT NULL,
  FOREIGN KEY (exampart_uuid) REFERENCES exampart(uuid) ON DELETE CASCADE,
  FOREIGN KEY (tag_uuid) REFERENCES tag(uuid) ON DELETE RESTRICT
);
CREATE INDEX exampart_tag_index ON exampart_tag(exampart_uuid, tag_uuid);

CREATE TABLE examquestion(
  exampart_uuid TEXT NOT NULL,
  question_uuid TEXT NOT NULL,
  idx INTEGER NOT NULL,
  answer_order TEXT NOT NULL,
  examinee_answer INTEGER,
  FOREIGN KEY (exampart_uuid) REFERENCES exampart(uuid) ON DELETE CASCADE,
  FOREIGN KEY (question_uuid) REFERENCES question(uuid) ON DELETE RESTRICT
);
CREATE INDEX examquestion_index ON examquestion(exampart_uuid, question_uuid);
