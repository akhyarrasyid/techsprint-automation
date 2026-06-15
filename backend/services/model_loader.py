class ModelRegistry:
    def __init__(self):
        self.mode = "mock"
        self.lightgbm = None
        self.catboost = None
        self.fastai_nn = None

registry = ModelRegistry()
