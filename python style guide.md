**1)** Never use catch-all "except:" statements, or catch "Exception" or "StandardError", unless you are 
     *re-raising the exception, or 
	 *creating an isolation point in the program where exceptions are not propagated but are recorded and suppressed instead, such as protecting a thread from crashing by 
	  guarding its outermost block.


**2)** Use default iterators and operators for types that support them, like lists, dictionaries, and files.
The built-in types define iterator methods, too. Prefer these methods to methods that return lists, except that you should not mutate a container while iterating over it.

```
Yes:  for key in adict: ...
      if obj in alist: ...
      for line in afile: ...
      for k, v in adict.items(): ...

No:   for key in adict.keys(): ...
      for line in afile.readlines(): ...
```

**3)** Use generators as needed.  Use “Yields:” rather than “Returns:” in the docstring for generator functions.
If the generator manages an expensive resource, make sure to force the clean up.
A good way to do the clean up is by wrapping the generator with a context manager (PEP-0533).


**4)** Do not use mutable objects as default values in the function or method definition.

```
Yes: def foo(a, b=None):
         if b is None:
             b = []
			 
Yes: def foo(a, b: Sequence | None = None):
         if b is None:
             b = []
			 
Yes: def foo(a, b: Sequence = ()):  # Empty tuple OK since tuples are immutable.
         ...


No:  def foo(a, b=[]):
         ...
		 
No:  def foo(a, b=time.time()):  # Is `b` supposed to represent when this module was loaded?
         ...
		 
No:  def foo(a, b: Mapping = {}):  # Could still get passed to unchecked code.
```


**5)** Properties are allowed, but, like operator overloading, should only be used when necessary and match the expectations of typical attribute access; 
follow the getters and setters rules otherwise.

For example, using a property to simply both get and set an internal attribute isn’t allowed: there is no computation occurring, so the property is unnecessary 
(make the attribute public instead). 
In comparison, using a property to control attribute access or to calculate a trivially derived value is allowed: the logic is simple and unsurprising.

Properties should be created with the `@property` decorator. Inheritance with properties can be non-obvious. 
Do not use properties to implement computations a subclass may ever want to override and extend.


**6)** **True/False Evaluations**:

Use the “implicit” false if possible, e.g., `if foo:` rather than `if foo != []:`. There are a few caveats that you should keep in mind though:

- Always use if foo is None: (or is not None) to check for a None value. E.g., when testing whether a variable or argument that defaults to None was set to some other value. The other value might be a value that’s false in a boolean context!

- Never compare a boolean variable to False using ==. Use if not x: instead. If you need to distinguish False from None then chain the expressions, such as if not x and x is not None:.

- For sequences (strings, lists, tuples), use the fact that empty sequences are false, so if seq: and if not seq: are preferable to if len(seq): and if not len(seq): respectively.

- When handling integers, implicit false may involve more risk than benefit (i.e., accidentally handling None as 0). You may compare a value which is known to be an integer (and is not the result of len()) against the integer 0.

```
Yes: if not users:
         print('no users')

     if i % 10 == 0:
         self.handle_multiple_of_ten()

     def f(x=None):
         if x is None:
             x = []

No:  if len(users) == 0:
         print('no users')

     if not i % 10:
         self.handle_multiple_of_ten()

     def f(x=None):
         x = x or []
```

- Note that '0' (i.e., 0 as string) evaluates to true.

- Note that Numpy arrays may raise an exception in an implicit boolean context. Prefer the `.size` attribute when testing emptiness of a np.array (e.g. `if not users.size`).
		
	
**7)** **Lexical Scoping**: Okay to use.

A nested Python function can refer to variables defined in enclosing functions, but cannot assign to them. Variable bindings are resolved using lexical scoping, that is, based on the static program text. 
Any assignment to a name in a block will cause Python to treat all references to that name as a local variable, even if the use precedes the assignment. 
If a global declaration occurs, the name is treated as a global variable.

An example of the use of this feature is:

```
def get_adder(summand1: float) -> Callable[[float], float]:
    """Returns a function that adds numbers to a given number."""
    def adder(summand2: float) -> float:
        return summand1 + summand2

    return adder
```


**8)** Use decorators judiciously when there is a clear advantage. Decorators should follow the same import and naming guidelines as functions. Decorator pydoc should clearly state that the function is a decorator. 
Write unit tests for decorators. Avoid external dependencies in the decorator itself (e.g. don’t rely on files, sockets, database connections, etc.), 
since they might not be available when the decorator runs (at import time, perhaps from pydoc or other tools). 
A decorator that is called with valid parameters should (as much as possible) be guaranteed to succeed in all cases.


**9)** **Threading**:

Do not rely on the atomicity of built-in types. While Python’s built-in data types such as dictionaries appear to have atomic operations, there are corner cases where they aren’t atomic 
(e.g. if `__hash__` or `__eq__` are implemented as Python methods) and their atomicity should not be relied upon. Neither should you rely on atomic variable assignment (since this in turn depends on dictionaries).

Use the queue module’s Queue data type as the preferred way to communicate data between threads. Otherwise, use the threading module and its locking primitives. 
Prefer condition variables and threading.Condition instead of using lower-level locks.


**10)** You can annotate Python code with type hints according to `PEP-484`, and type-check the code at build time with a type checking tool like mypy.
Type annotations can be in the source or in a stub pyi file. Whenever possible, annotations should be in the source. Use pyi files for third-party or extension modules.


**11)** It is fine, though not required, to use parentheses around tuples. Do not use them in return statements or conditional statements unless using parentheses for implied line continuation or to indicate a tuple.


**12)** Indent your code blocks with `4` spaces.
Never use tabs. Implied line continuation should align wrapped elements vertically, or use a hanging 4-space indent. Closing (round, square or curly) brackets can be placed at the end of the expression, 
or on separate lines, but then should be indented the same as the line with the corresponding opening bracket.


**13)** Python uses docstrings to document code. A docstring is a string that is the first statement in a package, module, class or function. 
These strings can be extracted automatically through the __doc__ member of the object and are used by pydoc. (Try running pydoc on your module to see how it looks.) 
Always use the three-double-quote """ format for docstrings (per PEP 257). When writing more (encouraged), this must be followed by a blank line, 
followed by the rest of the docstring starting at the same cursor position as the first quote of the first line.


**14)** **Classes**:

Classes should have a docstring below the class definition describing the class. 
Public attributes, excluding properties, should be documented here in an Args section and follow the same formatting as a function’s Args section.

```
class SampleClass:
    """
    Summary of class here.

    Longer class information...
    Longer class information...

    Args:
        likes_spam: A boolean indicating if we like SPAM or not.
        eggs: An integer count of the eggs we have laid.
    """

    def __init__(self, likes_spam: bool = False):
        """
        Initializes the instance based on spam preference.

        Args:
          likes_spam: Defines if instance exhibits this preference.
        """
        self.likes_spam = likes_spam
        self.eggs = 0

    @property
    def butter_sticks(self) -> int:
        """
        The number of butter sticks we have.
		"""
```


All class docstrings should start with a one-line summary that describes what the class instance represents. 
This implies that subclasses of Exception should also describe what the exception represents, and not the context in which it might occur. 
The class docstring should not repeat unnecessary information, such as that the class is a class.

```
Yes:

class CheeseShopAddress:
    """
    The address of a cheese shop.

    ...
    """

class OutOfCheeseError(Exception):
    """
    No more cheese is available.
    """

No:

class CheeseShopAddress:
    """
    Class that describes the address of a cheese shop.

    ...
    """

class OutOfCheeseError(Exception):
    """
    Raised when no more cheese is available.
    """
```


**15)** **Block and Inline Comments**:

The final place to have comments is in tricky parts of the code. 
If you’re going to have to explain it at the next code review, you should comment it now. 
Complicated operations get a few lines of comments before the operations commence. Non-obvious ones get comments at the end of the line.

```
# We use a weighted dictionary search to find out where i is in
# the array.  We extrapolate position based on the largest num
# in the array and the array size and then do binary search to
# get the exact number.
if i & (i-1) == 0:  # True if i is 0 or a power of 2.
```

Never describe the code. Assume the person reading the code knows Python (though not what you’re trying to do) better than you do.

```
# BAD COMMENT: Now go through the b array and make sure whenever i occurs
# the next element is i+1
```


**16)** Pay attention to punctuation, spelling, and grammar; it is easier to read well-written comments than badly written ones.

Comments should be as readable as narrative text, with proper capitalization and punctuation. In many cases, complete sentences are more readable than sentence fragments. 
Shorter comments, such as comments at the end of a line of code, can sometimes be less formal, but you should be consistent with your style.

Although it can be frustrating to have a code reviewer point out that you are using a comma when you should be using a semicolon, 
it is very important that source code maintain a high level of clarity and readability.
Proper punctuation, spelling, and grammar help with that goal.


**17)** Use an f-string, even when the parameters are all strings. Use your best judgment to decide between string formatting options. A single join with `+` is okay but do not format with `+`.

```
Yes: x = f'name: {name}; score: {n}'
     
No: x = first + ', ' + second
    x = 'name: ' + name + '; score: ' + str(n)
```

Avoid using the `+` and `+=` operators to accumulate a string within a loop. In some conditions, accumulating a string with addition can lead to quadratic rather than linear running time. 
Although common accumulations of this sort may be optimized on CPython, that is an implementation detail. The conditions under which an optimization applies are not easy to predict and may change. 
Instead, add each substring to a list and ''.join the list after the loop terminates, or write each substring to an `io.StringIO buffer`. 
These techniques consistently have amortized-linear run-time complexity.

```
Yes: 

items = ['<table>']
for last_name, first_name in employee_list:
    items.append('<tr><td>%s, %s</td></tr>' % (last_name, first_name))
items.append('</table>')
employee_table = ''.join(items)

No: 

employee_table = '<table>'
for last_name, first_name in employee_list:
    employee_table += '<tr><td>%s, %s</td></tr>' % (last_name, first_name)
employee_table += '</table>'
```

Be consistent with your choice of string quote character within a file. Pick ' or " and stick with it. 
It is okay to use the other quote character on a string to avoid the need to backslash-escape quote characters within the string.

Prefer `"""` for multi-line strings rather than `'''`. 


```
No:
long_string = """This is pretty ugly.
Don't do this.
"""

Yes:
long_string = """This is fine if your use case can accept
    extraneous leading spaces."""


Yes:
long_string = ("And this too is fine if you cannot accept\n"
               "extraneous leading spaces.")

Yes:
import textwrap

long_string = textwrap.dedent("""\
    This is also fine, because textwrap.dedent()
    will collapse common leading spaces in each line.""")
```
	  
	  
**18)** The preferred way to manage files and similar resources is using the with statement:

```
with open("hello.txt") as hello_file:
    for line in hello_file:
        print(line)
```

For file-like objects that do not support the with statement, use contextlib.closing():

```
import contextlib

with contextlib.closing(urllib.urlopen("http://www.python.org/")) as front_page:
    for line in front_page:
        print(line)
```

In rare cases where context-based resource management is infeasible, code documentation must explain clearly how resource lifetime is managed.


**19)** **TODO Comments**:  

Use TODO comments for code that is temporary, a short-term solution, or good-enough but not perfect.

A TODO comment begins with the word TODO in all caps, a following colon, and probably a link to a resource that contains the context, if available. 
Follow this piece of context with an explanatory string introduced with a hyphen -. The purpose is to have a consistent TODO format that can be searched to find out how to get more details.

```
# TODO: crbug.com/192795 - Investigate cpufreq optimizations.
```

Avoid adding TODOs that refer to an individual or team as the context:

```
# TODO: @yourusername - File an issue and use a '*' for repetition.
```

If your TODO is of the form “At a future date do something” make sure that you either include a very specific date (“Fix by November 2009”) or 
a very specific event (“Remove this code when all clients can handle XML responses.”) that future code maintainers will comprehend. Issues are ideal for tracking this.


**20)** Imports should be on separate lines; there are exceptions for `typing` and `collections.abc` imports.

E.g.:

```
Yes: from collections.abc import Mapping, Sequence
     import os
     import sys
     from typing import Any, NewType

No:  import os, sys
```

Imports are always put at the top of the file, just after any module comments and docstrings and before module globals and constants. Imports should be grouped from most generic to least generic:

Python standard library imports. For example:
```
import sys
```

Third-party module or package imports. For example:

```
import tensorflow as tf
```

Code repository sub-package imports. For example:

```
from otherproject.ai import mind
```

Within each grouping, imports should be sorted lexicographically, ignoring case, according to each module’s full package path (the path in from path import ...). 
Code may optionally place a blank line between import sections.

```
import collections
import queue
import sys

from absl import app
from absl import flags
import bs4
import cryptography
import tensorflow as tf

from book.genres import scifi
from myproject.backend import huxley
from myproject.backend.hgwells import time_machine
from myproject.backend.state_machine import main_loop
from otherproject.ai import body
from otherproject.ai import mind
from otherproject.ai import soul
```


**21)** **Naming**:

- module_name, 
- package_name, 
- ClassName, 
- method_name, 
- ExceptionName, 
- function_name, 
- GLOBAL_CONSTANT_NAME, 
- global_var_name, 
- instance_var_name, 
- function_parameter_name, 
- local_var_name, 
- query_proper_noun_for_thing, 
- send_acronym_via_https.

Function names, variable names, and filenames should be descriptive; avoid abbreviation. In particular, do not use abbreviations that are ambiguous or unfamiliar to readers outside your project, 
and do not abbreviate by deleting letters within a word.


**22)** **Names to Avoid**:

Single character names, except for specifically allowed cases:

- counters or iterators (e.g. i, j, k, v, et al.)
- e as an exception identifier in try/except statements.
- f as a file handle in with statements
- private type variables with no constraints (e.g. _T = TypeVar("_T"), _P = ParamSpec("_P"))

Please be mindful not to abuse single-character naming. Generally speaking, descriptiveness should be proportional to the name’s scope of visibility. 
For example, i might be a fine name for 5-line code block but within multiple nested scopes, it is likely too vague.

Some don'ts:

- dashes (-) in any package/module name

- `__double_leading_and_trailing_underscore__` names (reserved by Python)

- offensive terms

- names that needlessly include the type of the variable (for example: `id_to_name_dict`)


**23)** **Naming Conventions**:

Prepending a single underscore ( _ ) has some support for protecting module variables and functions (linters will flag protected member access). 
Note that it is okay for unit tests to access protected constants from the modules under test.

Prepending a double underscore (__ aka “dunder”) to an instance variable or method effectively makes the variable or method private to its class (using name mangling); 
we discourage its use as it impacts readability and testability, and isn’t really private. Prefer a single underscore.

Place related classes and top-level functions together in a module. Unlike Java, there is no need to limit yourself to one class per module.

Use CapWords for class names, but lower_with_under.py for module names. Although there are some old modules named CapWords.py, 
this is now discouraged because it’s confusing when the module happens to be named after a class. (“wait – did I write import StringIO or from StringIO import StringIO?”)

New unit test files follow PEP 8 compliant lower_with_under method names, for example, test_<method_under_test>_<state>. 
For consistency with legacy modules that follow CapWords function names, underscores may appear in method names starting with test to separate logical components of the name. 
One possible pattern is test<MethodUnderTest>_<state>.


**24)** **Mathematical Notation**:

For mathematically heavy code, short variable names that would otherwise violate the style guide are preferred when they match established notation in a reference paper or algorithm. 
When doing so, reference the source of all naming conventions in a comment or docstring or, if the source is not accessible, clearly document the naming conventions. 
Prefer PEP8-compliant descriptive_names for public APIs, which are much more likely to be encountered out of context.


**25)** **Main**:

In Python, pydoc as well as unit tests require modules to be importable. If a file is meant to be used as an executable, its main functionality should be in a `main()` function, 
and your code should always check `if __name__ == '__main__'` before executing your main program, so that it is not executed when the module is imported.

Use:

```
def main():
    ...

if __name__ == '__main__':
    main()
```


**26)** **Function length**:

Prefer small and focused functions. Long functions are sometimes appropriate, so no hard limit on function length. If a function exceeds about 40 lines, 
think about whether it can be broken up without harming the structure of the program.

Even if your long function works perfectly now, someone modifying it in a few months may add new behavior. This could result in bugs that are hard to find. 
Keeping your functions short and simple makes it easier for other people to read and modify your code.

You could find long and complicated functions when working with some code. Do not be intimidated by modifying existing code: if working with such a function proves to be difficult, 
you find that errors are hard to debug, or you want to use a piece of it in several different contexts, consider breaking up the function into smaller and more manageable pieces.


**27)** **Type Annotations**:

Familiarize yourself with PEP-484. Annotating `self` or `cls` is generally not necessary. Self can be used if it is necessary for proper type information, e.g.

```
from typing import Self

class BaseClass:
    @classmethod
    def create(cls) -> Self:
        ...

    def difference(self, other: Self) -> float:
        ...
```

If any other variable or a returned type should not be expressed, use Any.
Annotate code that is prone to type-related errors (previous bugs or complexity).
Annotate code that is hard to understand.
Annotate code as it becomes stable from a types perspective. In many cases, you can annotate all the functions in mature code without losing too much flexibility.


**28)** **Forward Declarations**:

If you need to use a class name (from the same module) that is not yet defined – for example, if you need the class name inside the declaration of that class, 
or if you use a class that is defined later in the code, use a string for the class name.

```
Yes:
class MyClass:
    def __init__(self, stack: Sequence['MyClass'], item: 'OtherClass') -> None:

class OtherClass:
    ...
```


**29)** **NoneType**:

In the Python type system, NoneType is a “first class” type, and for typing purposes, None is an alias for NoneType. If an argument can be None, it has to be declared! 
Use `|` union type expressions.

Use explicit `X | None` instead of implicit. Earlier versions of PEP 484 allowed `a: str = None` to be interpreted as `a: str | None = None`, but that is no longer the preferred behavior.

```
Yes:
def modern_or_union(a: str | int | None, b: str | None = None) -> str:
    ...

No:
def union_optional(a: Union[str, int, None], b: Optional[str] = None) -> str:
    ...
def nullable_union(a: Union[None, str]) -> str:
    ...
def implicit_optional(a: str = None) -> str:
    ...
```


**30)** **Type Aliases**:

You can declare aliases of complex types. The name of an alias should be CapWorded. If the alias is used only in this module, it should be _Private.

Note that the : TypeAlias annotation is only supported in versions 3.10+.


```
from typing import TypeAlias

_LossAndGradient: TypeAlias = tuple[tf.Tensor, tf.Tensor]
ComplexTFMap: TypeAlias = Mapping[str, _LossAndGradient]
```


**31)** **Typing Variables**:

Annotated Assignments
If an internal variable has a type that is hard or impossible to infer, specify its type with an annotated assignment - use a colon and type between the variable name and value 
(the same as is done with function arguments that have a default value):

```
a: Foo = SomeUndecoratedFunction()
```

*Type Comments*: Though you may see them remaining in the codebase (they were necessary before Python 3.6), do not add any more uses of a `# type: <type name>` comment on the end of the line:

```
a = SomeUndecoratedFunction()  # type: Foo
```


**32)** **Tuples vs Lists**:

Typed lists can only contain objects of a single type. Typed tuples can either have a single repeated type or a set number of elements with different types. 
The latter is commonly used as the return type from a function.

```
a: list[int] = [1, 2, 3]
b: tuple[int, ...] = (1, 2, 3)
c: tuple[int, str, float] = (1, "2", 3.5)
```


**33)** **String types**:

Use str for string/text data. For code that deals with binary data, use bytes.

```
def deals_with_text_data(x: str) -> str:
    ...
def deals_with_binary_data(x: bytes) -> bytes:
    ...
```

If all the string types of a function are always the same, for example if the return type is the same as the argument type in the code above, use AnyStr.


