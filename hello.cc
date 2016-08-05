#include <windows.h>
#include <node.h>
#include <v8.h>
 
using namespace v8;
 
void SleepFunc(const v8::FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);
  double arg0 = args[0] -> NumberValue();
  Sleep(arg0);
}
 
void Init(Handle<Object> exports) {
  Isolate* isolate = Isolate::GetCurrent();
  exports->Set(String::NewFromUtf8(isolate, "sleep"),
      FunctionTemplate::New(isolate, SleepFunc)->GetFunction());
}
 
NODE_MODULE(hello, Init);