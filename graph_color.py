import json
from ortools.sat.python import cp_model
import time


graphJson = json.load(open("graphJson.json","r"))
model = cp_model.CpModel()
max_color = graphJson["Colors"]
model_var_dict = dict()
for period in graphJson["Period Data"]:
    for len_ in range(period["length"]):
        for freq in range(period["frequency"]):
            name = period["name"] + "Period" + str(len_) + "Freq" + str(freq)
            model_var_dict[name] = model.NewIntVar(0, max_color-1, name)
for period in graphJson["Period Data"]:
    for freq in range(period["frequency"]):
        for len_ in range(1, period["length"]):
            name_0 = period["name"] + "Period" + str(len_-1) + "Freq" + str(freq)
            name_1 = period["name"] + "Period" + str(len_) + "Freq" + str(freq)
            model.Add(model_var_dict[name_0] + 1 == model_var_dict[name_1])
for edge in graphJson["Edge Data"]:
    left = edge["left"]
    right = edge["right"]    
    if len(left) > 24 and len(right) > 24:
        model.Add(model_var_dict[left] != model_var_dict[right])
    elif len(left) > 24 and len(right) < 24:
        model.Add(model_var_dict[left] != int(right))
    elif len(left) < 24 and len(right) > 24:
        model.Add(model_var_dict[right] != int(left))
    else:
        1
t0 = time.time()
solver = cp_model.CpSolver()
status = solver.Solve(model)
t1 = time.time()
coloringJson = dict()
if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
    print("Done")
    for key in model_var_dict:
        print(key + ' = %i' % solver.Value(model_var_dict[key]))
        coloringJson[key] = solver.Value(model_var_dict[key])
else:
    print('No solution found.')
print(t1 - t0)
with open('coloringJson.json', 'w', encoding='utf-8') as f:
    json.dump(coloringJson, f, ensure_ascii=False, indent=4)