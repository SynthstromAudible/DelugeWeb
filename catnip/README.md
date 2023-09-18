Basic Tracing in the Deluge.

There is a ready-to-run version of the tracer at:

https://www.fentonia.com/deluge/trace/


The catnip tracer application uses the Debug::print() and Debug::println() statements to generate log data.

Place such statements where you want logging to take place, and turn such logging on.

For example:

Debug::println("Play Start");

... code.

Debug::println("~Play");

Right now, the resulting log entries will look like this:

A100F007 Play Start

A2002000 ~Play

You can also capture log info from RTT (JLink real time trace). This avoids using the Midi SysEx mechanism and is thus slightly faster. Use the file opening button.

The code keys off the first word in the statement to find a trace "tag". Each tag gets its own line.
In the above example, the "~" is a cue that this println is an "ending event" that matches the
earlier tag value, so the tracer will draw a bar showing the start time and the ending time connected.

If the print() / println() has a number in it, such as:

Debug::println(63);

You will see:

02002123 Loop Count 63

then the tracer will take all the values from the "Loop" tag and plot them as a time-series graph.

The first word is the tag, the last number is value for the time series.
There are other tricks to this not documented here. They will be when we get the "trace-helper" classes closer to final.

An example trace-helper looks like this:

RTimer sdt("SDread"); // this captures a "start time".

... code

sdt.stop(); // this stops the stopwatch. Note you don't need the tag, since we already have SDread.

If you don't call stop(), the STimer destructor will. This might be right after creation due to C++ optimization.

The RTrace stopwatch generates a special log entry with both start time and duration in one event.

You can reset RTrace to get a new starting time without creating a new object.

sdt.stop(char *str );

 tacks the string str onto the end of start ime string. It is concatenated so if you may want to put include a space in it if you want to add-on a separate word.
 
 