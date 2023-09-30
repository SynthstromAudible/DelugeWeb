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


If you don't use the ~, you will get a "callout event" rather than an interval.

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

The RTimer stopwatch generates a special log entry with both start time and duration in one event.

You can reset RTimer to get a new starting time without creating a new object.

sdt.stop(char *str );

 tacks the string str onto the end of start ime string. It is concatenated so if you may want to put include a space in it if you want to add-on a separate word.
 
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

If you don't use the ~, you will get a "callout event" rather than an interval.

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

The RTimer stopwatch generates a special log entry with both start time and duration in one event.

You can reset RTimer to get a new starting time without creating a new object.

sdt.stop(char *str );

 tacks the string str onto the end of start ime string. It is concatenated so if you may want to put include a space in it if you want to add-on a separate word.


We have added several helper classes to make working with this stuff easier.

| Class      | purpose                                                |
| ---------- | ------------------------------------------------------ |
| Averager   | every N calls, print the average  value of a parameter |
| OneOfN     | every N calls, run a RTimer, others do nothing.        |
| CountsPer  | every N ticks, report the value of a counter.          |
| AverageDT  | every N tick, report a average delta time.             |
| AverageVOT | every N ticks, report the average value of a parameter |
| OnceEvery  | Like One of end but uses a time interval               |                                                      |


 ```
class Averager {
public:
	Averager(const char* label, uint32_t repeats = 0);
	void	setCount(uint32_t repeats); // Sample 1 out of srepeats time.
	void	logValue(int32_t val); // Logs a value, prints 1 out of repeats iterations.
	void 	setN(uint32_t numRepeats);
};
	Debug::Averager avg("avg", 1000);
	avg.logValue(x);

class OneOfN{
public:
	OneOfN(const char* label, uint32_t repeats = 0);

	void start(); // Marks an event start (and increments counter)
	void stop();  // Marks the event ending. 
	void split(const char* splitLabel); // Logs an intermediate event.
	void setN(uint32_t numRepeats); // sets 1 out of N repeat count.
};

	Debug::OnOfN pipeT("render", 250); // every 250 times.
	pipe.start();
	pipe.split("disk read");
	pipe.split("reverb");
	pipe.stop();

class OnceEvery{
public:
	OnceEvery(const char* label, uint32_t timeBase);

	void start(); // Marks an event start (and increments counter)
	void stop();  // Marks the event ending. 
	void split(const char* splitLabel); // Logs an intermediate event.
 };

	Debug::OnceEvery cat("cat", 20 * Debug::mS);
	cat.start();
	cat.stop();

class CountsPer {
public:
	// Reports a average after each timeBase interval
	CountsPer(const char* label, uint32_t timeBase);
	void bump(); // increase the counter value.
};
	debug::CountsPer ctr("midi", 2 * debug::mS);
	ctr.bump();

class AverageDT {
public:
	AverageDT(const char* label, uint32_t timeBase, uint32_t scaling = 1);
	void begin(); // sets the t0 time of the event to now, to time an interval.
	void note(); // every timeBase ticks, report the average DT
};

	debug::AverageDT avg("avg", 2 * debug::mS);
	avg.note();
		alternatively to time from a later beginning:
			avg.begin();
			avg.note();
		alternative constructor to convert ticks to other units:
	         debug::AverageDT avg("avg", 2 * debug::mS, debug::uS);
	Calling note() without a begin() captures the "time away".

class AverageVOT {
// every timeBase ticks, report the average value.
	AverageVOT(const char* label, uint32_t timeBase);
	void note(uint32_t value);
	void clear();
};

	debug::AverageVOT avgV("rate", 2500 * debug::uS);
	avgV.note(sampCount);
	
```

The clear() method appears in many of these classes. It resets an object's count, timer, etc.
clear() is rarely needed and may be dropped.

The classes with a time interval in them are more useful as they are less likely to flood the logging buffers.
