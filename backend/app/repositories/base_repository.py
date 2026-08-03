from sqlalchemy.orm import Session


class BaseRepository:
    """
    الفئة الأساسية لجميع مستودعات قاعدة البيانات.
    """

    def __init__(self, db: Session):
        self.db = db