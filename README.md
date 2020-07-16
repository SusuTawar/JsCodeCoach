# JsCodeCoach

Useable code challenges for javascript

## Table of Contents

- [Where to use](#where-to-use)
- [Creating Challenge](#creating-challenge)
	- [File Type & Location](#file-type-and-location)
	- [Challenge Bits spec](#challenge-bits-spec)
	- [Test Case spec](#test-case-spec)
	- [Test File](#test-file)
	- [Examples](#examples)
		- [Challenge Bits Example](#challenge-bits-example)
		- [Test File Example](#test-file-example)
- [Tasks](#tasks)
- [License](#license)

## Where to Use

- [Sololearn](https://code.sololearn.com/WJpzGA72Ohv4/?ref=app)

## Creating Challenge

### File Type and Location

every challenge bits saved in challenges directory as json, and big test case stored in test_file directory as plain txt.

- challenge bits name should be same as its title, but lower case and space replaced by underscore `_`
- test case name should also follow challenge bits file naming rule, with added suffix indicating the test number

### Challenge Bits spec

|     key      | value                                            |
| :----------: | ------------------------------------------------ |
|    title     | Challenge's title                                |
| description  | Describe the scenario where the task could apply |
|     task     | Short explanation of the challenge               |
|    input     | format input that will be given as parameter(s)  |
|    output    | accepted output format                           |
|   example    | example of input(s) and its output               |
| functionName | function name that will be used in editor        |
|  paramsName  | parameter(s) name that will be used in editor    |
|   testCase   | see [Test Case](#test-case-spec)                 |

### Test Case spec

testCase should be array of an `Object` or `String` pointing to file in **test_file** directory

|  key   | value                                                        |
| :----: | ------------------------------------------------------------ |
| input  | array, representing parameter that will be passin evaluation |
| output | result that should appear based on the given input           |

### Test File

consist of repeating input, output pattern seperated by single linebreak `\n`. each input seperated by space to represent an item in array.

### Examples

#### Challenge Bits Example

filename: `simple_addition.json`

```json
{
  "title": "Simple Addition",
  "description": "Your teacher teach you how to calculate 2 basket of apples can you manage to do it ?",
  "task": "given the amount of apples in each basket, count how many apples there are",
  "input": "Two integer values, first is the amount of apple in basket 1, second is the amount im basket 2",
  "output": "Total apple in integer",
  "example": "input: 5, 4 \noutput: 9",
  "functionName": "appleCount",
  "paramsName": ["basket_1", "basket_2"],
  "testCase": {
    "Test 1": [{ "input": [5, 4], "output": 9 }],
    "Test 2": [{ "input": [0, 0], "output": 0 }],
    "Test 3": "simple_addition_3.txt",
    "Test 4": "simple_addition_4.txt"
  }
}
```

#### Test File Example

filename: `simple_addition_3.txt`

```
1 2
3
3 9
12
9 0
9
0 1
1
0 0
0
```

## Tasks

- [ ] evaluate Promise
- [ ] string input with whitespace
- [ ] non-primitive type input and output

## License

[MIT License](LICENSE)
