"""restore missing add match scores revision"""

from typing import Sequence, Union


revision: str = "e17b41e89ee0"
down_revision: Union[str, Sequence[str], None] = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # قاعدة البيانات تحتوي أصلًا على أعمدة نتائج المباراة.
    pass


def downgrade() -> None:
    pass